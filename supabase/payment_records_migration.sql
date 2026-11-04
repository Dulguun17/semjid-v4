-- Reception payment ledger. Apply after the workspace-role and staff-booking
-- workflow migrations. This migration preserves existing booking/payment data
-- and deliberately does not convert booking totals into payment records.

create table if not exists public.booking_payment_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  kind text not null check (kind in ('payment','refund')),
  status text not null check (status in ('pending','requested','completed','voided')),
  amount bigint not null check (amount > 0),
  method text not null check (method in ('cash','bank_transfer','online','other')),
  provider text,
  provider_reference text,
  received_on date,
  reference text,
  note text,
  reason text,
  idempotency_key text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  verified_by uuid references auth.users(id) on delete set null,
  completed_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint booking_payment_record_state_check check (
    (kind = 'payment' and status in ('pending','completed','voided'))
    or (kind = 'refund' and status in ('requested','completed','voided'))
  ),
  constraint booking_payment_record_completion_date_check check (
    status <> 'completed' or received_on is not null
  ),
  constraint booking_payment_record_idempotency_key_check check (
    length(idempotency_key) between 8 and 128
  )
);

create index if not exists booking_payment_records_booking_idx
  on public.booking_payment_records (booking_id, created_at desc);
create index if not exists booking_payment_records_pending_idx
  on public.booking_payment_records (booking_id, kind, status)
  where status in ('pending','requested');

create table if not exists public.booking_payment_record_events (
  id uuid primary key default gen_random_uuid(),
  payment_record_id uuid not null references public.booking_payment_records(id) on delete restrict,
  event_type text not null check (event_type in ('created','status_changed')),
  previous_status text,
  new_status text not null,
  actor_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists booking_payment_record_events_record_idx
  on public.booking_payment_record_events (payment_record_id, created_at);

alter table public.booking_payment_records enable row level security;
alter table public.booking_payment_record_events enable row level security;
drop policy if exists "Staff read booking payment records" on public.booking_payment_records;
create policy "Staff read booking payment records"
  on public.booking_payment_records for select to authenticated
  using (public.has_workspace_role(array['staff']));
drop policy if exists "Staff read booking payment events" on public.booking_payment_record_events;
create policy "Staff read booking payment events"
  on public.booking_payment_record_events for select to authenticated
  using (public.has_workspace_role(array['staff']));
revoke all on public.booking_payment_records from public, anon, authenticated;
revoke all on public.booking_payment_record_events from public, anon, authenticated;
grant select on public.booking_payment_records, public.booking_payment_record_events to authenticated;

create or replace function public.audit_booking_payment_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.booking_id is distinct from old.booking_id
      or new.kind is distinct from old.kind
      or new.amount is distinct from old.amount
      or new.method is distinct from old.method
      or new.provider is distinct from old.provider
      or new.provider_reference is distinct from old.provider_reference
      or new.reference is distinct from old.reference
      or new.note is distinct from old.note
      or new.idempotency_key is distinct from old.idempotency_key
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at then
      raise exception 'Payment record details are immutable; record a correction instead'
        using errcode = '22023';
    end if;
    if new.status is not distinct from old.status then
      raise exception 'Payment record updates must change status' using errcode = '22023';
    end if;
    insert into public.booking_payment_record_events (
      payment_record_id, event_type, previous_status, new_status, actor_id, reason
    ) values (
      new.id, 'status_changed', old.status, new.status, auth.uid(),
      nullif(current_setting('app.payment_change_reason', true), '')
    );
    return new;
  end if;

  insert into public.booking_payment_record_events (
    payment_record_id, event_type, new_status, actor_id, reason
  ) values (
    new.id, 'created', new.status, auth.uid(), new.reason
  );
  return new;
end;
$$;
revoke all on function public.audit_booking_payment_record() from public, anon, authenticated;

drop trigger if exists booking_payment_record_audit on public.booking_payment_records;
create trigger booking_payment_record_audit
  after insert or update on public.booking_payment_records
  for each row execute function public.audit_booking_payment_record();

create or replace function public.record_staff_payment(
  p_booking_id uuid,
  p_kind text,
  p_amount bigint,
  p_method text,
  p_status text,
  p_received_on date,
  p_reference text,
  p_note text,
  p_reason text,
  p_idempotency_key text,
  p_verified boolean default false
)
returns public.booking_payment_records
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_record public.booking_payment_records%rowtype;
  v_existing public.booking_payment_records%rowtype;
  v_received bigint;
  v_refunded bigint;
  v_refund_requests bigint;
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  if p_booking_id is null or p_kind is null or p_kind not in ('payment','refund')
    or p_amount is null or p_amount <= 0
    or p_method is null or p_method not in ('cash','bank_transfer')
    or p_status is null or p_idempotency_key is null
    or length(p_idempotency_key) not between 8 and 128 then
    raise exception 'Valid booking, amount, method, and request key are required'
      using errcode = '22023';
  end if;

  select * into v_booking
  from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found' using errcode = 'P0002'; end if;

  select * into v_existing
  from public.booking_payment_records
  where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.booking_id = p_booking_id
      and v_existing.kind = p_kind
      and v_existing.amount = p_amount
      and v_existing.method = p_method
      and v_existing.status = p_status
      and v_existing.received_on is not distinct from p_received_on
      and v_existing.reference is not distinct from nullif(trim(p_reference), '')
      and v_existing.note is not distinct from nullif(trim(p_note), '')
      and v_existing.reason is not distinct from nullif(trim(p_reason), '')
      and (
        p_method <> 'bank_transfer'
        or coalesce(p_verified, false) = (v_existing.verified_by is not null)
      ) then
      return v_existing;
    end if;
    raise exception 'Request key was already used for a different payment'
      using errcode = '23505';
  end if;

  if p_kind = 'payment' then
    if p_status not in ('pending','completed')
      or (p_method = 'cash' and p_status <> 'completed')
      or (p_status = 'pending' and p_received_on is not null)
      or (p_status = 'completed' and (not coalesce(p_verified, false) and p_method = 'bank_transfer'))
      or (p_status = 'completed' and p_received_on is null)
      or p_received_on > (now() at time zone 'Asia/Ulaanbaatar')::date then
      raise exception 'Cash is recorded when received; bank transfers require verification before completion'
        using errcode = '22023';
    end if;
  else
    if p_status <> 'requested'
      or nullif(trim(p_reason), '') is null
      or p_received_on is not null then
      raise exception 'Refunds must be requested with a reason; record a return only when it is completed'
        using errcode = '22023';
    end if;

    select
      coalesce(sum(amount) filter (where kind = 'payment' and status = 'completed'), 0),
      coalesce(sum(amount) filter (where kind = 'refund' and status = 'completed'), 0),
      coalesce(sum(amount) filter (where kind = 'refund' and status = 'requested'), 0)
    into v_received, v_refunded, v_refund_requests
    from public.booking_payment_records
    where booking_id = p_booking_id;
    if p_amount > v_received - v_refunded - v_refund_requests then
      raise exception 'Refund request exceeds the amount received and not already refunded or requested'
        using errcode = '22023';
    end if;
  end if;

  perform set_config('app.payment_change_reason', coalesce(nullif(trim(p_reason), ''), ''), true);
  insert into public.booking_payment_records (
    booking_id, kind, status, amount, method, received_on, reference, note,
    reason, idempotency_key, created_by, verified_by, completed_by, verified_at, completed_at
  ) values (
    p_booking_id, p_kind, p_status, p_amount, p_method, p_received_on,
    nullif(trim(p_reference), ''), nullif(trim(p_note), ''),
    nullif(trim(p_reason), ''), p_idempotency_key, auth.uid(),
    case when p_kind = 'payment' and p_status = 'completed' and p_method = 'bank_transfer'
      then auth.uid() else null end,
    case when p_status = 'completed' then auth.uid() else null end,
    case when p_kind = 'payment' and p_status = 'completed' and p_method = 'bank_transfer'
      then now() else null end,
    case when p_status = 'completed' then now() else null end
  ) returning * into v_record;
  perform set_config('app.payment_change_reason', '', true);
  return v_record;
end;
$$;
revoke all on function public.record_staff_payment(uuid,text,bigint,text,text,date,text,text,text,text,boolean)
  from public, anon;
grant execute on function public.record_staff_payment(uuid,text,bigint,text,text,date,text,text,text,text,boolean)
  to authenticated;

create or replace function public.update_staff_payment_record(
  p_record_id uuid,
  p_action text,
  p_reason text,
  p_verified boolean default false,
  p_received_on date default null
)
returns public.booking_payment_records
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record public.booking_payment_records%rowtype;
  v_booking_id uuid;
  v_received bigint;
  v_refunded bigint;
  v_refund_requests bigint;
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('complete_payment','complete_refund','void')
    or p_record_id is null then
    raise exception 'Invalid payment record action' using errcode = '22023';
  end if;
  if p_action in ('complete_refund','void') and not public.is_workspace_manager() then
    raise exception 'Manager access required' using errcode = '42501';
  end if;
  if p_action in ('complete_refund','void') and nullif(trim(p_reason), '') is null then
    raise exception 'A reason is required for refund completion or correction'
      using errcode = '22023';
  end if;
  if p_action in ('complete_payment','complete_refund')
    and coalesce(p_received_on, (now() at time zone 'Asia/Ulaanbaatar')::date)
      > (now() at time zone 'Asia/Ulaanbaatar')::date then
    raise exception 'Receipt date cannot be in the future' using errcode = '22023';
  end if;

  select booking_id into v_booking_id
  from public.booking_payment_records where id = p_record_id;
  if not found then raise exception 'Payment record not found' using errcode = 'P0002'; end if;
  perform 1 from public.bookings where id = v_booking_id for update;
  select * into v_record
  from public.booking_payment_records where id = p_record_id for update;

  if p_action = 'complete_payment' then
    if v_record.kind <> 'payment' or v_record.status <> 'pending'
      or v_record.method <> 'bank_transfer' or not coalesce(p_verified, false) then
      raise exception 'Only a pending bank transfer can be completed after verification'
        using errcode = '22023';
    end if;
  elsif p_action = 'complete_refund' then
    if v_record.kind <> 'refund' or v_record.status <> 'requested' then
      raise exception 'Only a requested refund can be completed' using errcode = '22023';
    end if;
    select
      coalesce(sum(amount) filter (where kind = 'payment' and status = 'completed'), 0),
      coalesce(sum(amount) filter (
        where kind = 'refund' and status = 'completed'
      ), 0),
      coalesce(sum(amount) filter (
        where kind = 'refund' and status = 'requested' and id <> p_record_id
      ), 0)
    into v_received, v_refunded, v_refund_requests
    from public.booking_payment_records
    where booking_id = v_booking_id;
    if v_record.amount > v_received - v_refunded - v_refund_requests then
      raise exception 'Completed refunds would exceed verified receipts'
        using errcode = '22023';
    end if;
  elsif p_action = 'void' then
    if v_record.status not in ('pending','requested','completed') then
      raise exception 'This payment record cannot be corrected again' using errcode = '22023';
    end if;
    if v_record.kind = 'payment' and v_record.status = 'completed' then
      select
        coalesce(sum(amount) filter (
          where kind = 'payment' and status = 'completed' and id <> p_record_id
        ), 0),
        coalesce(sum(amount) filter (
          where kind = 'refund' and status = 'completed'
        ), 0),
        coalesce(sum(amount) filter (
          where kind = 'refund' and status = 'requested'
        ), 0)
      into v_received, v_refunded, v_refund_requests
      from public.booking_payment_records
      where booking_id = v_booking_id;
      if v_refunded + v_refund_requests > v_received then
        raise exception 'This payment cannot be voided because refunds rely on it'
          using errcode = '22023';
      end if;
    end if;
  end if;

  perform set_config('app.payment_change_reason', trim(p_reason), true);
  update public.booking_payment_records set
    status = case when p_action = 'void' then 'voided' else 'completed' end,
    received_on = case
      when p_action = 'complete_payment' then coalesce(p_received_on, (now() at time zone 'Asia/Ulaanbaatar')::date)
      when p_action = 'complete_refund' then coalesce(p_received_on, (now() at time zone 'Asia/Ulaanbaatar')::date)
      else received_on end,
    verified_by = case when p_action = 'complete_payment' then auth.uid() else verified_by end,
    completed_by = case when p_action = 'void' then null else auth.uid() end,
    verified_at = case when p_action = 'complete_payment' then now() else verified_at end,
    reason = case when nullif(trim(p_reason), '') is not null then trim(p_reason) else reason end,
    updated_at = now(),
    completed_at = case when p_action = 'void' then null else now() end
  where id = p_record_id
  returning * into v_record;
  perform set_config('app.payment_change_reason', '', true);
  return v_record;
end;
$$;
revoke all on function public.update_staff_payment_record(uuid,text,text,boolean,date)
  from public, anon;
grant execute on function public.update_staff_payment_record(uuid,text,text,boolean,date)
  to authenticated;
