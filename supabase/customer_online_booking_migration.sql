-- Isolated test preparation. Apply after all existing workspace/customer migrations.
-- Production stays gated. The database switch defaults to false.
begin;
alter table public.booking_config
  add column if not exists customer_online_booking_enabled boolean not null default false;
alter table public.bookings
  add column if not exists customer_request_id uuid,
  add column if not exists customer_request_payload jsonb;
create unique index if not exists bookings_customer_request_unique
  on public.bookings (customer_user_id, customer_request_id)
  where customer_request_id is not null;
alter table public.bookings drop constraint if exists bookings_source_phase2_check;
alter table public.bookings add constraint bookings_source_phase2_check
  check (source is null or source in ('phone','walk_in','legacy','online')) not valid;

-- Share the existing bed locks, capacity, gender, rate, dates and audit logic.
create or replace function public.create_validated_bed_booking(p_booking jsonb, p_customer_user_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_room_id text := nullif(trim(p_booking->>'room_id'), '');
  v_check_in date := nullif(p_booking->>'check_in', '')::date;
  v_check_out date := nullif(p_booking->>'check_out', '')::date;
  v_guests integer := nullif(p_booking->>'guests', '')::integer;
  v_status text := coalesce(p_booking->>'status', 'pending');
  v_source text := coalesce(p_booking->>'source', 'phone');
  v_expiry integer;
  v_stay_nights integer;
  v_advance_months integer;
  v_rate integer;
  v_capacity integer;
  v_bed_ids text[];
  v_genders text[];
begin
  if p_customer_user_id is null then
    if not public.has_workspace_role(array['staff']) then
      raise exception 'Staff access required' using errcode = '42501';
    end if;
  elsif p_customer_user_id is distinct from auth.uid()
    or not public.has_workspace_role(array['customer']) then
    raise exception 'Customer access required' using errcode = '42501';
  end if;
  if p_booking is null or jsonb_typeof(p_booking) <> 'object'
    or jsonb_typeof(p_booking->'bed_assignments') is distinct from 'array' then
    raise exception 'A booking and individual bed assignments are required' using errcode = '22023';
  end if;
  perform public.expire_pending_bookings();
  select pending_expiry_minutes, stay_nights, advance_months
    into v_expiry, v_stay_nights, v_advance_months
  from public.booking_config where id = true;
  if v_room_id is null or v_guests is null or v_guests < 1
    or jsonb_array_length(p_booking->'bed_assignments') <> v_guests then
    raise exception 'Assign one distinct bed and gender per guest' using errcode = '22023';
  end if;
  if v_status not in ('pending','confirmed','checked_in','cancelled','no_show')
    or (p_customer_user_id is null and v_source not in ('phone','walk_in'))
    or (p_customer_user_id is not null and (v_source <> 'online' or v_status <> 'pending')) then
    raise exception 'Invalid booking status or source' using errcode = '22023';
  end if;
  if nullif(trim(p_booking->>'fname'), '') is null
    or nullif(trim(p_booking->>'lname'), '') is null
    or nullif(trim(p_booking->>'phone'), '') is null
    or v_check_in is null or v_check_out is null
    or v_check_out <> v_check_in + v_stay_nights
    or v_check_in < (now() at time zone 'Asia/Ulaanbaatar')::date
    or v_check_in > ((now() at time zone 'Asia/Ulaanbaatar')::date + make_interval(months => v_advance_months))::date then
    raise exception 'Name, phone, room, and valid policy dates are required' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_room_id, 0));
  select r.capacity, coalesce(r.adult1, r.adult2)
    into v_capacity, v_rate
  from public.room_units u join public.rooms r on r.id = u.category_id
  where u.id = v_room_id and u.active;
  if v_capacity is null then
    raise exception 'Room is not active or does not exist' using errcode = 'P0002';
  end if;
  if v_guests > v_capacity or v_rate is null or v_rate < 0 then
    raise exception 'Guest count or room rate is invalid' using errcode = '22023';
  end if;
  select array_agg(item->>'bed_id'), array_agg(item->>'guest_gender')
    into v_bed_ids, v_genders
  from jsonb_array_elements(p_booking->'bed_assignments') as assignments(item);
  if cardinality(v_bed_ids) <> cardinality(array(
      select distinct bed_id from unnest(v_bed_ids) as beds(bed_id)
    ))
    or cardinality(v_genders) <> v_guests
    or exists (
      select 1 from unnest(v_genders) as genders(gender)
      where gender is null or gender not in ('female','male','unknown')
    ) then
    raise exception 'Bed IDs must be distinct and each guest needs a valid gender' using errcode = '22023';
  end if;
  if v_status in ('pending','confirmed','checked_in')
    and (
      'unknown' = any(v_genders)
      or cardinality(array(
        select distinct gender from unnest(v_genders) as genders(gender)
      )) <> 1
    ) then
    raise exception 'Every guest in a room must have the same known gender'
      using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(v_bed_ids) selected(bed_id)
    left join public.room_beds rb on rb.id = selected.bed_id
    where rb.id is null or rb.room_id <> v_room_id or not rb.active
  ) then
    raise exception 'Every assigned bed must belong to this active room' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.room_blocks bl
    where bl.room_id = v_room_id and bl.cancelled_at is null
      and bl.from_date < v_check_out and bl.to_date >= v_check_in
  ) then
    raise exception 'Room is closed for part of these dates' using errcode = '23P01';
  end if;
  if exists (
    select 1 from public.bookings legacy
    join public.room_units u on u.id = v_room_id
    where legacy.bed_allocation_required
      and legacy.status in ('pending','confirmed','checked_in')
      and (legacy.expires_at is null or legacy.expires_at > now())
      and (legacy.room_id = v_room_id or legacy.room_id = u.category_id)
      and legacy.check_in < v_check_out and legacy.check_out > v_check_in
  ) then
    raise exception 'Unallocated historical bookings must be resolved by staff before this room can be booked'
      using errcode = '23P01';
  end if;
  if exists (
    select 1 from unnest(v_bed_ids) selected(bed_id)
    join public.booking_bed_assignments a on a.bed_id = selected.bed_id and a.released_at is null
    join public.bookings b on b.id = a.booking_id
    where b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and (
        (b.check_in < v_check_out and b.check_out > v_check_in)
        or (b.status = 'checked_in' and b.actual_check_out_at is null)
      )
  ) then
    raise exception 'One or more selected beds are already reserved' using errcode = '23P01';
  end if;
  if v_status in ('pending','confirmed','checked_in') and exists (
    select 1 from public.bookings b
    where b.room_id = v_room_id and b.bed_gender_review_required
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and (
        (b.check_in < v_check_out and b.check_out > v_check_in)
        or (b.status = 'checked_in' and b.actual_check_out_at is null)
      )
  ) then
    raise exception 'An overlapping reservation has unresolved gender details'
      using errcode = '23P01';
  end if;
  if v_status in ('pending','confirmed','checked_in') and exists (
    select 1 from public.booking_bed_assignments a
    join public.bookings b on b.id = a.booking_id
    where a.released_at is null and b.room_id = v_room_id
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and (
        (b.check_in < v_check_out and b.check_out > v_check_in)
        or (b.status = 'checked_in' and b.actual_check_out_at is null)
      )
      and (a.guest_gender = 'unknown' or a.guest_gender <> all(v_genders))
  ) then
    raise exception 'Separate reservations sharing a room must have the same known gender'
      using errcode = '23P01';
  end if;

  insert into public.bookings (
    ref, fname, lname, phone, email, room_id, check_in, check_out, guests,
    guest_details, treatments, notes, payment, payment_status, total, status,
    source, customer_user_id, created_by, updated_by, updated_at, expires_at,
    bed_allocation_required, actual_check_in_at, actual_check_out_at
  ) values (
    (case when p_customer_user_id is null then 'STF-' else 'ONL-' end) || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    trim(p_booking->>'fname'), trim(p_booking->>'lname'), trim(p_booking->>'phone'),
    nullif(trim(p_booking->>'email'), ''), v_room_id, v_check_in, v_check_out,
    v_guests, coalesce(p_booking->'guest_details', '[]'::jsonb),
    coalesce(array(select jsonb_array_elements_text(p_booking->'treatments')), '{}'),
    nullif(trim(p_booking->>'notes'), ''), coalesce(p_booking->>'payment', 'cash'),
    'unrecorded', v_rate * v_guests * v_stay_nights, v_status, v_source, p_customer_user_id,
    auth.uid(), auth.uid(), now(),
    case when v_status = 'pending' then now() + make_interval(mins => v_expiry) else null end,
    false,
    case when v_status = 'checked_in' then now() else null end,
    case when v_status = 'checked_out' then now() else null end
  ) returning * into v_booking;

  insert into public.booking_bed_assignments (booking_id, bed_id, guest_gender, assigned_by, actual_check_in_at, actual_check_out_at)
  select v_booking.id, item->>'bed_id', item->>'guest_gender', auth.uid(),
    case when v_status = 'checked_in' then now() else null end,
    case when v_status = 'checked_out' then now() else null end
  from jsonb_array_elements(p_booking->'bed_assignments') as assignments(item);
  return v_booking;
end;
$$;
revoke all on function public.create_validated_bed_booking(jsonb,uuid) from public, anon, authenticated;

create or replace function public.create_staff_bed_booking(p_booking jsonb)
returns public.bookings language sql security definer set search_path = ''
as $$ select public.create_validated_bed_booking(p_booking, null::uuid); $$;
revoke all on function public.create_staff_bed_booking(jsonb) from public, anon;
grant execute on function public.create_staff_bed_booking(jsonb) to authenticated;

create or replace function public.create_customer_bed_booking(
  p_booking jsonb, p_request_id uuid, p_expected_total text
)
returns public.bookings language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_input jsonb;
  v_booking public.bookings%rowtype;
  v_email text;
begin
  if v_owner is null or not public.has_workspace_role(array['customer']) then
    raise exception 'Customer access required' using errcode = '42501';
  end if;
  if not coalesce((select customer_online_booking_enabled from public.booking_config where id = true), false) then
    raise exception 'Customer online booking is closed' using errcode = '42501';
  end if;
  if p_request_id is null or p_booking is null or jsonb_typeof(p_booking) <> 'object'
    or p_expected_total is null or p_expected_total !~ '^[0-9]+$'
    or coalesce(p_booking->>'payment', '') not in ('cash','bank')
    or length(coalesce(p_booking->>'fname','')) not between 1 and 100
    or length(coalesce(p_booking->>'lname','')) not between 1 and 100
    or length(coalesce(p_booking->>'phone','')) not between 1 and 30
    or length(coalesce(p_booking->>'notes','')) > 2000 then
    raise exception 'Valid booking details and quoted price are required' using errcode = '22023';
  end if;
  select email into v_email from auth.users
  where id = v_owner and email_confirmed_at is not null;
  if not found then
    raise exception 'A verified customer account is required' using errcode = '42501';
  end if;
  v_input := jsonb_build_object(
    'fname', trim(p_booking->>'fname'), 'lname', trim(p_booking->>'lname'),
    'phone', trim(p_booking->>'phone'), 'email', v_email,
    'room_id', p_booking->>'room_id', 'check_in', p_booking->>'check_in',
    'check_out', p_booking->>'check_out', 'guests', p_booking->'guests',
    'bed_assignments', p_booking->'bed_assignments', 'notes', p_booking->>'notes',
    'payment', p_booking->>'payment', 'status', 'pending', 'source', 'online'
  );
  perform pg_advisory_xact_lock(hashtextextended(v_owner::text || p_request_id::text, 0));
  select * into v_booking from public.bookings
  where customer_user_id = v_owner and customer_request_id = p_request_id;
  if found then
    if v_booking.customer_request_payload is distinct from
      (v_input || jsonb_build_object('expected_total', p_expected_total)) then
      raise exception 'Request key was already used for different details' using errcode = '23505';
    end if;
    return v_booking;
  end if;
  v_booking := public.create_validated_bed_booking(v_input, v_owner);
  if v_booking.total::text <> p_expected_total then
    raise exception 'The price changed. Review a fresh quote before submitting' using errcode = '22023';
  end if;
  update public.bookings
  set customer_request_id = p_request_id,
      customer_request_payload = v_input || jsonb_build_object('expected_total', p_expected_total)
  where id = v_booking.id
  returning * into v_booking;
  return v_booking;
end;
$$;
revoke all on function public.create_customer_bed_booking(jsonb,uuid,text) from public, anon;
grant execute on function public.create_customer_bed_booking(jsonb,uuid,text) to authenticated;
commit;
