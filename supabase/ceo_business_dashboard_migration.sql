-- Read-only CEO aggregates. Apply after workspace_roles_migration.sql,
-- staff_booking_workflow_migration.sql, and payment_records_migration.sql.
-- No booking, payment, room, or historical status rows are backfilled.

create table if not exists public.booking_status_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  old_status text not null,
  new_status text not null,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists booking_status_events_created_idx
  on public.booking_status_events (created_at, new_status);

create table if not exists public.ceo_report_config (
  id boolean primary key default true check (id),
  status_history_started_at timestamptz not null default now(),
  report_coverage_started_at timestamptz not null default now()
);
alter table public.ceo_report_config
  add column if not exists report_coverage_started_at timestamptz not null default now();
insert into public.ceo_report_config (id)
values (true)
on conflict (id) do nothing;

alter table public.booking_status_events enable row level security;
alter table public.ceo_report_config enable row level security;
revoke all on public.booking_status_events, public.ceo_report_config
  from public, anon, authenticated;

create or replace function public.capture_booking_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.booking_status_events (
      booking_id, old_status, new_status, actor_id, created_at
    ) values (
      new.id, old.status, new.status, auth.uid(), now()
    );
  end if;
  return new;
end;
$$;
revoke all on function public.capture_booking_status_event() from public, anon, authenticated;
drop trigger if exists booking_status_event_trigger on public.bookings;
create trigger booking_status_event_trigger
  after update of status on public.bookings
  for each row execute function public.capture_booking_status_event();

create table if not exists public.booking_payment_coverage (
  booking_id uuid primary key references public.bookings(id) on delete restrict,
  coverage_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.booking_payment_coverage enable row level security;
revoke all on public.booking_payment_coverage from public, anon, authenticated;

create or replace function public.start_booking_payment_coverage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.booking_payment_coverage (booking_id)
  values (new.id)
  on conflict (booking_id) do nothing;
  return new;
end;
$$;
revoke all on function public.start_booking_payment_coverage() from public, anon, authenticated;
drop trigger if exists booking_payment_coverage_trigger on public.bookings;
create trigger booking_payment_coverage_trigger
  after insert on public.bookings
  for each row execute function public.start_booking_payment_coverage();

create or replace function public.get_ceo_business_dashboard(
  p_start_date date,
  p_end_date date,
  p_previous_start_date date,
  p_previous_end_date date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Ulaanbaatar')::date;
  v_history_started_at timestamptz;
  v_report_coverage_started_at timestamptz;
  v_report jsonb;
begin
  if not public.has_workspace_role(array['ceo']) then
    raise exception 'CEO workspace access required' using errcode = '42501';
  end if;
  if p_start_date is null or p_end_date is null
    or p_previous_start_date is null or p_previous_end_date is null
    or p_start_date > p_end_date
    or p_previous_start_date > p_previous_end_date
    or p_end_date > v_today
    or p_end_date - p_start_date > 365
    or p_previous_end_date - p_previous_start_date <> p_end_date - p_start_date
    or p_previous_end_date + 1 <> p_start_date then
    raise exception 'Report dates must be valid, non-future, contiguous, and at most 366 days'
      using errcode = '22023';
  end if;

  select c.status_history_started_at, c.report_coverage_started_at
    into v_history_started_at, v_report_coverage_started_at
  from public.ceo_report_config c where c.id = true;

  with periods(scope, start_date, end_date) as (
    values
      ('current'::text, p_start_date, p_end_date),
      ('previous'::text, p_previous_start_date, p_previous_end_date)
  ),
  booking_summary as (
    select p.scope,
      count(b.id) filter (
        where b.created_at >= (p.start_date::timestamp at time zone 'Asia/Ulaanbaatar')
          and b.created_at < ((p.end_date + 1)::timestamp at time zone 'Asia/Ulaanbaatar')
      ) as booking_count,
      coalesce(sum(coalesce(b.total, 0)) filter (
        where b.created_at >= (p.start_date::timestamp at time zone 'Asia/Ulaanbaatar')
          and b.created_at < ((p.end_date + 1)::timestamp at time zone 'Asia/Ulaanbaatar')
      ), 0) as booking_value
    from periods p
    left join public.bookings b on true
    group by p.scope
  ),
  status_summary as (
    select p.scope,
      count(e.id) filter (where e.new_status = 'cancelled') as cancellations,
      count(e.id) filter (where e.new_status = 'no_show') as no_shows
    from periods p
    left join public.booking_status_events e
      on e.created_at >= (p.start_date::timestamp at time zone 'Asia/Ulaanbaatar')
      and e.created_at < ((p.end_date + 1)::timestamp at time zone 'Asia/Ulaanbaatar')
    group by p.scope
  ),
  payment_summary as (
    select p.scope,
      coalesce(sum(r.amount) filter (
        where r.kind = 'payment' and r.status = 'completed'
          and r.received_on between p.start_date and p.end_date
      ), 0) as completed_payments,
      coalesce(sum(r.amount) filter (
        where r.kind = 'refund' and r.status = 'completed'
          and r.received_on between p.start_date and p.end_date
      ), 0) as completed_refunds,
      coalesce(sum(r.amount) filter (
        where r.kind = 'payment' and r.status = 'completed'
          and r.method = 'cash' and r.received_on between p.start_date and p.end_date
      ), 0) as cash_received,
      coalesce(sum(r.amount) filter (
        where r.kind = 'payment' and r.status = 'completed'
          and r.method = 'bank_transfer' and r.received_on between p.start_date and p.end_date
      ), 0) as bank_received
    from periods p
    left join public.booking_payment_records r on true
    group by p.scope
  ),
  period_days as (
    select p.scope, generated.day::date as stay_date
    from periods p
    cross join lateral generate_series(p.start_date, p.end_date, interval '1 day') generated(day)
  ),
  legacy_overlaps as (
    select distinct d.scope, d.stay_date, b.id as booking_id, b.room_id
    from period_days d
    join public.bookings b
      on b.bed_allocation_required
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and (
        (b.check_in <= d.stay_date and b.check_out > d.stay_date)
        or (
          b.status = 'checked_in' and b.actual_check_out_at is null
          and b.check_in <= d.stay_date and d.stay_date <= v_today
        )
      )
  ),
  capacity_summary as (
    select d.scope,
      count(*) as eligible_bed_nights
    from period_days d
    join public.room_beds rb on rb.active
    join public.room_units u on u.id = rb.room_id and u.active
    where not exists (
      select 1 from public.room_blocks bl
      where bl.room_id = u.id and bl.cancelled_at is null
        and bl.from_date <= d.stay_date and bl.to_date >= d.stay_date
    )
    and not exists (
      select 1 from legacy_overlaps legacy
      where legacy.scope = d.scope and legacy.stay_date = d.stay_date
        and (legacy.room_id = u.id or legacy.room_id = u.category_id)
    )
    group by d.scope
  ),
  occupied_nights as (
    select distinct d.scope, d.stay_date, a.bed_id
    from period_days d
    join public.booking_bed_assignments a
      on a.actual_check_in_at is not null
      and (greatest(a.actual_check_in_at, a.assigned_at) at time zone 'Asia/Ulaanbaatar')::date <= d.stay_date
      and case
        when coalesce(a.actual_check_out_at, a.released_at) is not null then
          (coalesce(a.actual_check_out_at, a.released_at) at time zone 'Asia/Ulaanbaatar')::date > d.stay_date
        else d.stay_date <= v_today
      end
    join public.bookings b on b.id = a.booking_id
      and b.status in ('checked_in','checked_out')
    join public.room_beds rb on rb.id = a.bed_id and rb.active
    join public.room_units u on u.id = rb.room_id and u.active
    where not exists (
      select 1 from public.room_blocks bl
      where bl.room_id = u.id and bl.cancelled_at is null
        and bl.from_date <= d.stay_date and bl.to_date >= d.stay_date
    )
    and not exists (
      select 1 from legacy_overlaps legacy
      where legacy.scope = d.scope and legacy.stay_date = d.stay_date
        and (legacy.room_id = u.id or legacy.room_id = u.category_id)
    )
  ),
  occupied_summary as (
    select scope, count(*) as occupied_bed_nights
    from occupied_nights group by scope
  ),
  legacy_quality as (
    select p.scope, count(distinct b.id) as incomplete_legacy_allocations
    from periods p
    left join public.bookings b
      on b.bed_allocation_required
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and (
        (b.check_in <= p.end_date and b.check_out > p.start_date)
        or (b.status = 'checked_in' and b.actual_check_out_at is null
          and b.check_in <= least(p.end_date, v_today))
      )
    group by p.scope
  ),
  balances_by_booking as (
    select b.id, b.total, b.status, c.booking_id is not null as covered,
      coalesce(sum(r.amount) filter (
        where r.kind = 'payment' and r.status = 'completed'
      ), 0) - coalesce(sum(r.amount) filter (
        where r.kind = 'refund' and r.status = 'completed'
      ), 0) as net_received
    from public.bookings b
    left join public.booking_payment_coverage c on c.booking_id = b.id
    left join public.booking_payment_records r on r.booking_id = b.id
    where b.status not in ('cancelled','no_show')
    group by b.id, b.total, b.status, c.booking_id
  ),
  balance_summary as (
    select
      coalesce(sum(greatest(coalesce(total, 0) - net_received, 0))
        filter (where covered and total is not null), 0) as outstanding,
      coalesce(sum(greatest(net_received - coalesce(total, 0), 0))
        filter (where covered and total is not null), 0) as overpayments,
      count(*) filter (where covered and total is not null) as covered_bookings,
      count(*) filter (where not covered or total is null) as unknown_bookings
    from balances_by_booking
  ),
  daily_financials as (
    select d.stay_date,
      coalesce(sum(r.amount) filter (
        where r.kind = 'payment' and r.status = 'completed'
      ), 0) as payments,
      coalesce(sum(r.amount) filter (
        where r.kind = 'refund' and r.status = 'completed'
      ), 0) as refunds,
      coalesce(sum(r.amount) filter (
        where r.kind = 'payment' and r.status = 'completed' and r.method = 'cash'
      ), 0) as cash_received,
      coalesce(sum(r.amount) filter (
        where r.kind = 'payment' and r.status = 'completed' and r.method = 'bank_transfer'
      ), 0) as bank_received
    from period_days d
    left join public.booking_payment_records r
      on r.status = 'completed' and r.received_on = d.stay_date
    where d.scope = 'current'
    group by d.stay_date
  ),
  current_quality as (
    select
      coalesce((select incomplete_legacy_allocations from legacy_quality where scope = 'current'), 0) as incomplete_legacy_allocations,
      coalesce((select incomplete_legacy_allocations from legacy_quality where scope = 'previous'), 0) as previous_incomplete_legacy_allocations
  )
  select jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date,
      'previous_start_date', p_previous_start_date,
      'previous_end_date', p_previous_end_date
    ),
    'current', (
      select jsonb_build_object(
        'completed_payments', ps.completed_payments::text,
        'completed_refunds', ps.completed_refunds::text,
        'net_received', (ps.completed_payments - ps.completed_refunds)::text,
        'cash_received', ps.cash_received::text,
        'bank_received', ps.bank_received::text,
        'booking_count', bs.booking_count::text,
        'booking_value', bs.booking_value::text,
        'cancellations', ss.cancellations::text,
        'no_shows', ss.no_shows::text,
        'occupied_bed_nights', coalesce(os.occupied_bed_nights, 0)::text,
        'eligible_bed_nights', coalesce(cs.eligible_bed_nights, 0)::text
      )
      from payment_summary ps
      join booking_summary bs using (scope)
      join status_summary ss using (scope)
      left join occupied_summary os using (scope)
      left join capacity_summary cs using (scope)
      where ps.scope = 'current'
    ),
    'previous', (
      select jsonb_build_object(
        'completed_payments', ps.completed_payments::text,
        'completed_refunds', ps.completed_refunds::text,
        'net_received', (ps.completed_payments - ps.completed_refunds)::text,
        'cash_received', ps.cash_received::text,
        'bank_received', ps.bank_received::text,
        'booking_count', bs.booking_count::text,
        'booking_value', bs.booking_value::text,
        'cancellations', ss.cancellations::text,
        'no_shows', ss.no_shows::text,
        'occupied_bed_nights', coalesce(os.occupied_bed_nights, 0)::text,
        'eligible_bed_nights', coalesce(cs.eligible_bed_nights, 0)::text
      )
      from payment_summary ps
      join booking_summary bs using (scope)
      join status_summary ss using (scope)
      left join occupied_summary os using (scope)
      left join capacity_summary cs using (scope)
      where ps.scope = 'previous'
    ),
    'balances_as_of_now', (
      select jsonb_build_object(
        'outstanding', outstanding::text,
        'overpayments', overpayments::text,
        'covered_bookings', covered_bookings::text,
        'unknown_bookings', unknown_bookings::text
      ) from balance_summary
    ),
    'income_trend', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'date', stay_date,
        'payments', payments::text,
        'refunds', refunds::text,
        'net_received', (payments - refunds)::text,
        'cash_received', cash_received::text,
        'bank_received', bank_received::text
      ) order by stay_date), '[]'::jsonb)
      from daily_financials
    ),
    'data_quality', jsonb_build_object(
      'incomplete_legacy_allocations', (select incomplete_legacy_allocations::text from current_quality),
      'previous_incomplete_legacy_allocations', (select previous_incomplete_legacy_allocations::text from current_quality),
      'status_history_since', v_history_started_at,
      'status_history_incomplete',
        p_start_date < (v_history_started_at at time zone 'Asia/Ulaanbaatar')::date
        or p_previous_start_date < (v_history_started_at at time zone 'Asia/Ulaanbaatar')::date,
      'payment_history_since', v_report_coverage_started_at,
      'payment_history_incomplete',
        p_start_date < (v_report_coverage_started_at at time zone 'Asia/Ulaanbaatar')::date
        or p_previous_start_date < (v_report_coverage_started_at at time zone 'Asia/Ulaanbaatar')::date,
      'balance_coverage_complete', (select unknown_bookings = 0 from balance_summary)
    ),
    'online_payment_status', 'not_connected'
  )
  into v_report;

  return v_report;
end;
$$;
revoke all on function public.get_ceo_business_dashboard(date,date,date,date)
  from public, anon;
grant execute on function public.get_ceo_business_dashboard(date,date,date,date)
  to authenticated;
