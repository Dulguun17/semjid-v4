-- Staff booking workflow: authoritative inventory, capacity-safe reservations,
-- booking lifecycle, expiry, and append-only change history.
-- Apply only after the base application tables and rooms table exist, and
-- workspace_roles_migration.sql has completed. Never run schema.sql against
-- an existing database; it drops application tables.

alter table public.rooms
  add column if not exists capacity integer,
  add column if not exists child37a integer,
  add column if not exists child37b integer,
  add column if not exists child812a integer,
  add column if not exists child812b integer;

-- Reconcile the previous category IDs with the current catalogue IDs. Values
-- already maintained under current IDs win, then the prior mapped ID, then the
-- checked-in default. Non-null database prices are never overwritten.
with defaults (
  id, legacy_id, name_mn, name_en, capacity, adult1, adult2, child02,
  child37a, child37b, child812a, child812b, img
) as (
  values
    ('luxury','lux','Люкс өрөө','Luxury Room',2,null,113000,43000,null,null,null,68000,'/images/image3.jpeg'),
    ('halflux','delux','Хагас Люкс өрөө','Half-Luxury Room',2,null,93000,43000,null,null,null,68000,'/images/image4.jpeg'),
    ('superlux',null,'Супер Люкс өрөө','Super Lux Room',2,null,135000,43000,null,null,null,68000,'/images/image4.jpeg'),
    ('fullux',null,'Фулл Люкс өрөө','Full Lux Room',2,null,150000,43000,null,null,null,68000,'/images/image3.jpeg'),
    ('std2','standard','2 Ортой Стандарт өрөө','2-Bed Standard Room',2,88000,null,43000,53000,null,68000,null,'/images/image5.jpeg'),
    ('std4','ger2','4 Ортой Стандарт өрөө','4-Bed Standard Room',4,83000,88000,43000,53000,53000,68000,68000,'/images/image6.jpeg'),
    ('std5','ger5','5 Ортой Стандарт өрөө','5-Bed Standard Room',5,83000,null,43000,53000,null,68000,null,'/images/image3.jpeg'),
    ('summer','gerpack','Зуны байр','Summer Cottage',3,78000,null,43000,53000,null,68000,null,'/images/resort-nature.jpg')
), resolved as (
  select d.*,
    old.name_mn as old_name_mn, old.name_en as old_name_en,
    old.adult1 as old_adult1, old.adult2 as old_adult2,
    old.child02 as old_child02, old.child37a as old_child37a,
    old.child37b as old_child37b, old.child812a as old_child812a,
    old.child812b as old_child812b, old.img as old_img
  from defaults d
  left join public.rooms old on old.id = d.legacy_id
)
insert into public.rooms (
  id, name_mn, name_en, capacity, adult1, adult2, child02, child37a,
  child37b, child812a, child812b, img
) select id, coalesce(nullif(old_name_mn, ''), name_mn),
  coalesce(nullif(old_name_en, ''), name_en), capacity,
  coalesce(old_adult1, adult1), coalesce(old_adult2, adult2),
  coalesce(old_child02, child02), coalesce(old_child37a, child37a),
  coalesce(old_child37b, child37b), coalesce(old_child812a, child812a),
  coalesce(old_child812b, child812b), coalesce(nullif(old_img, ''), img)
from resolved
on conflict (id) do update set
  capacity = coalesce(public.rooms.capacity, excluded.capacity),
  adult1 = coalesce(public.rooms.adult1, excluded.adult1),
  adult2 = coalesce(public.rooms.adult2, excluded.adult2),
  child02 = coalesce(public.rooms.child02, excluded.child02),
  child37a = coalesce(public.rooms.child37a, excluded.child37a),
  child37b = coalesce(public.rooms.child37b, excluded.child37b),
  child812a = coalesce(public.rooms.child812a, excluded.child812a),
  child812b = coalesce(public.rooms.child812b, excluded.child812b),
  img = coalesce(nullif(public.rooms.img, ''), excluded.img);

alter table public.rooms
  drop constraint if exists rooms_capacity_positive;
alter table public.rooms
  add constraint rooms_capacity_positive check (capacity is null or capacity > 0) not valid;
revoke insert, update, delete on public.rooms from anon, authenticated;
grant select on public.rooms to anon, authenticated;
grant insert, update, delete on public.rooms to authenticated;

create table if not exists public.room_units (
  id text primary key,
  category_id text not null references public.rooms(id) on update cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- This inventory is the existing physical-room list, moved from application
-- constants to the database. Existing booking room IDs are not rewritten.
insert into public.room_units (id, category_id) values
  ('101','std2'),('102','std2'),('103','std5'),('104','std5'),
  ('105','std2'),('106','std2'),('107','std2'),('108','std2'),
  ('109','std2'),('110','std2'),('111','std2'),('112','std2'),
  ('113','std2'),('115','std2'),('116','std2'),
  ('117','std4'),('118','std4'),('119','std4'),('120','std4'),
  ('121','std4'),('122','std4'),('123','std4'),('124','std4'),
  ('125','std2'),('126','std2'),('129','std4'),('130','std2'),
  ('131','std4'),('201','superlux'),('202','std4'),('203','fullux'),
  ('204','std4'),('206','std4'),('207','fullux'),('209','std2'),
  ('210','std4'),('211','std2'),('212','std4'),('213','std2')
on conflict (id) do nothing;

alter table public.bookings
  add column if not exists payment_status text,
  add column if not exists source text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists expired_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists price_adjustment_reason text;

-- Existing payment history is deliberately left null/unrecorded. Existing
-- status and date values are not rewritten or treated as new events.
alter table public.bookings
  drop constraint if exists bookings_status_check,
  drop constraint if exists bookings_status_phase2_check,
  add constraint bookings_status_phase2_check
    check (status in ('pending','confirmed','checked_in','checked_out','cancelled','no_show')) not valid,
  drop constraint if exists bookings_payment_status_phase2_check,
  add constraint bookings_payment_status_phase2_check
    check (payment_status is null or payment_status in ('unrecorded','pending','paid','partial','refunded')) not valid,
  drop constraint if exists bookings_source_phase2_check,
  add constraint bookings_source_phase2_check
    check (source is null or source in ('phone','walk_in','legacy')) not valid;

create index if not exists bookings_room_dates_active_idx
  on public.bookings (room_id, check_in, check_out)
  where status in ('pending','confirmed','checked_in');
create index if not exists bookings_expiry_idx
  on public.bookings (expires_at) where status = 'pending';

create table if not exists public.booking_config (
  id boolean primary key default true check (id),
  pending_expiry_minutes integer not null default 30
    check (pending_expiry_minutes between 5 and 43200),
  stay_nights integer not null default 7 check (stay_nights between 1 and 30),
  advance_months integer not null default 3 check (advance_months between 1 and 24),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.booking_config
  add column if not exists stay_nights integer not null default 7,
  add column if not exists advance_months integer not null default 3;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_config'::regclass
      and conname = 'booking_config_stay_nights_valid'
  ) then
    alter table public.booking_config
      add constraint booking_config_stay_nights_valid
      check (stay_nights between 1 and 30) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.booking_config'::regclass
      and conname = 'booking_config_advance_months_valid'
  ) then
    alter table public.booking_config
      add constraint booking_config_advance_months_valid
      check (advance_months between 1 and 24) not valid;
  end if;
end;
$$;
alter table public.booking_config
  validate constraint booking_config_stay_nights_valid,
  validate constraint booking_config_advance_months_valid;
insert into public.booking_config (id) values (true) on conflict (id) do nothing;

create table if not exists public.booking_audit (
  id bigint generated always as identity primary key,
  booking_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  changed_fields text[] not null default '{}',
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists booking_audit_booking_created_idx
  on public.booking_audit (booking_id, created_at desc);

create table if not exists public.room_block_audit (
  id bigint generated always as identity primary key,
  block_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.room_blocks
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null;

-- Staff may read bookings, but all writes go through the checked database RPCs.
drop policy if exists "Staff manage bookings" on public.bookings;
drop policy if exists "Staff read bookings" on public.bookings;
create policy "Staff read bookings"
  on public.bookings for select to authenticated
  using (public.has_workspace_role(array['staff']));
revoke insert, update, delete on public.bookings from anon, authenticated;
grant select on public.bookings to authenticated;

alter table public.room_units enable row level security;
drop policy if exists "Staff read room units" on public.room_units;
drop policy if exists "Managers manage room units" on public.room_units;
create policy "Staff read room units"
  on public.room_units for select to authenticated
  using (public.has_workspace_role(array['staff']));
create policy "Managers manage room units"
  on public.room_units for all to authenticated
  using (public.is_workspace_manager())
  with check (public.is_workspace_manager());
revoke all on public.room_units from anon, authenticated;
grant select, insert, update, delete on public.room_units to authenticated;

alter table public.booking_config enable row level security;
drop policy if exists "Managers manage booking config" on public.booking_config;
create policy "Managers manage booking config"
  on public.booking_config for all to authenticated
  using (public.is_workspace_manager())
  with check (public.is_workspace_manager());
revoke all on public.booking_config from anon, authenticated;
grant select on public.booking_config to authenticated;
grant update (pending_expiry_minutes) on public.booking_config to authenticated;

create or replace function public.touch_booking_config()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
revoke all on function public.touch_booking_config() from public, anon, authenticated;
drop trigger if exists booking_config_touch_trigger on public.booking_config;
create trigger booking_config_touch_trigger
  before update on public.booking_config
  for each row execute function public.touch_booking_config();

alter table public.booking_audit enable row level security;
alter table public.room_block_audit enable row level security;
drop policy if exists "Managers read booking audit" on public.booking_audit;
drop policy if exists "Managers read room block audit" on public.room_block_audit;
create policy "Managers read booking audit"
  on public.booking_audit for select to authenticated
  using (public.is_workspace_manager());
create policy "Managers read room block audit"
  on public.room_block_audit for select to authenticated
  using (public.is_workspace_manager());
revoke all on public.booking_audit, public.room_block_audit from anon, authenticated;
grant select on public.booking_audit, public.room_block_audit to authenticated;

drop policy if exists "Staff manage room blocks" on public.room_blocks;
drop policy if exists "Staff read room blocks" on public.room_blocks;
drop policy if exists "Staff create room blocks" on public.room_blocks;
drop policy if exists "Staff update room blocks" on public.room_blocks;
create policy "Staff read room blocks"
  on public.room_blocks for select to authenticated
  using (public.has_workspace_role(array['staff']));
create policy "Staff create room blocks"
  on public.room_blocks for insert to authenticated
  with check (public.has_workspace_role(array['staff']) and cancelled_at is null);
create policy "Staff update room blocks"
  on public.room_blocks for update to authenticated
  using (public.has_workspace_role(array['staff']))
  with check (public.has_workspace_role(array['staff']));
revoke delete on public.room_blocks from anon, authenticated;
grant select, insert, update on public.room_blocks to authenticated;

create or replace function public.audit_booking_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fields text[];
  v_action text;
  v_booking_id uuid;
begin
  if tg_op = 'DELETE' then
    raise exception 'Bookings cannot be deleted; cancel or archive them instead'
      using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    v_action := 'created';
    v_booking_id := new.id;
    new.updated_at := coalesce(new.updated_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := coalesce(new.updated_by, auth.uid());
    v_fields := array['created'];
  else
    new.updated_at := now();
    new.updated_by := auth.uid();
    v_booking_id := new.id;
    select coalesce(array_agg(n.key order by n.key), '{}')
      into v_fields
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value
      and n.key not in ('updated_at','updated_by');
    if cardinality(v_fields) = 0 then
      return new;
    end if;
    v_action := 'updated';
  end if;

  insert into public.booking_audit (booking_id, actor_id, action, changed_fields, reason)
  values (
    v_booking_id, auth.uid(), v_action, v_fields,
    nullif(current_setting('app.booking_change_reason', true), '')
  );
  return new;
end;
$$;
revoke all on function public.audit_booking_change() from public, anon, authenticated;
drop trigger if exists booking_audit_trigger on public.bookings;
create trigger booking_audit_trigger
  before insert or update or delete on public.bookings
  for each row execute function public.audit_booking_change();

create or replace function public.audit_room_block_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lock_room text;
begin
  if tg_op = 'DELETE' then
    raise exception 'Room blocks cannot be deleted; cancel them instead'
      using errcode = '42501';
  end if;
  if new.room_id is null then
    raise exception 'A room is required for a room closure' using errcode = '22023';
  end if;
  if new.from_date is null or new.to_date is null or new.from_date > new.to_date then
    raise exception 'A room closure requires a valid date range' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' then
    for v_lock_room in
      select distinct room_id
      from unnest(array[old.room_id, new.room_id]) as rooms(room_id)
      where room_id is not null
      order by room_id
    loop
      perform pg_advisory_xact_lock(hashtextextended(v_lock_room, 0));
    end loop;
  else
    perform pg_advisory_xact_lock(hashtextextended(new.room_id, 0));
  end if;
  if not exists (
    select 1 from public.room_units u where u.id = new.room_id and u.active
  ) then
    raise exception 'Room is not active in the inventory' using errcode = '22023';
  end if;
  if new.cancelled_at is null and exists (
    select 1
    from public.bookings b
    join public.room_units u on u.id = new.room_id
    where (
        b.room_id = new.room_id
        or (b.room_id = u.category_id and b.bed_allocation_required)
      )
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and new.from_date < b.check_out
      and new.to_date >= b.check_in
  ) then
    raise exception 'Room closure overlaps an active reservation'
      using errcode = '23P01';
  end if;
  insert into public.room_block_audit (block_id, actor_id, action, reason)
  values (
    coalesce(new.id, old.id), auth.uid(),
    case when tg_op = 'INSERT' then 'created' else 'updated' end,
    case when tg_op = 'INSERT' then new.reason else coalesce(new.reason, old.reason) end
  );
  return new;
end;
$$;
revoke all on function public.audit_room_block_change() from public, anon, authenticated;
drop trigger if exists room_block_audit_trigger on public.room_blocks;
create trigger room_block_audit_trigger
  before insert or update or delete on public.room_blocks
  for each row execute function public.audit_room_block_change();

create or replace function public.expire_pending_bookings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.bookings b
  set status = 'cancelled',
      expired_at = now(),
      cancellation_reason = 'Pending reservation expired automatically',
      expires_at = null
  where b.status = 'pending'
    and b.expires_at is not null
    and b.expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.expire_pending_bookings() from public, anon, authenticated;
grant execute on function public.expire_pending_bookings() to service_role;

create or replace function public.expire_pending_bookings_for_staff()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  return public.expire_pending_bookings();
end;
$$;
revoke all on function public.expire_pending_bookings_for_staff() from public, anon;
grant execute on function public.expire_pending_bookings_for_staff() to authenticated;

create or replace function public.get_staff_booking_policy()
returns table (stay_nights integer, advance_months integer, pending_expiry_minutes integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  return query
    select c.stay_nights, c.advance_months, c.pending_expiry_minutes
    from public.booking_config c where c.id = true;
end;
$$;
revoke all on function public.get_staff_booking_policy() from public, anon;
grant execute on function public.get_staff_booking_policy() to authenticated;

create or replace function public.get_public_room_catalog()
returns table (
  id text, capacity integer, adult1 integer, adult2 integer, child02 integer,
  child37a integer, child37b integer, child812a integer, child812b integer,
  img text, unit_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.capacity, r.adult1, r.adult2, r.child02, r.child37a,
    r.child37b, r.child812a, r.child812b, r.img,
    count(u.id) filter (where u.active)
  from public.rooms r
  left join public.room_units u on u.category_id = r.id
  group by r.id
  order by r.id;
$$;
revoke all on function public.get_public_room_catalog() from public;
grant execute on function public.get_public_room_catalog() to anon, authenticated;

drop function if exists public.get_staff_room_availability(text,date,date,uuid);
create or replace function public.get_staff_room_availability(
  p_room_id text,
  p_check_in date,
  p_check_out date,
  p_exclude_booking uuid default null,
  p_guests integer default 1
)
returns table (
  available boolean,
  occupied_guests integer,
  capacity integer,
  blocked boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_occupied integer;
  v_blocked boolean;
  v_stay_nights integer;
  v_advance_months integer;
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  select c.stay_nights, c.advance_months
    into v_stay_nights, v_advance_months
  from public.booking_config c where c.id = true;
  if p_room_id is null or p_check_in is null or p_check_out is null
    or p_guests is null or p_guests < 1
    or p_check_out <> p_check_in + v_stay_nights
    or p_check_in < current_date
    or p_check_in > (current_date + make_interval(months => v_advance_months))::date then
    raise exception 'Stay dates do not match the current booking policy'
      using errcode = '22023';
  end if;

  perform public.expire_pending_bookings();

  select r.capacity into v_capacity
  from public.room_units u
  join public.rooms r on r.id = u.category_id
  where u.id = p_room_id and u.active;
  if v_capacity is null then
    raise exception 'Room is not active or does not exist' using errcode = 'P0002';
  end if;

  select coalesce(sum(b.guests), 0)::integer into v_occupied
  from public.bookings b
  where b.room_id = p_room_id
    and b.id is distinct from p_exclude_booking
    and b.status in ('pending','confirmed','checked_in')
    and (b.expires_at is null or b.expires_at > now())
    and b.check_in < p_check_out and b.check_out > p_check_in;

  select exists (
    select 1 from public.room_blocks rb
    where rb.room_id = p_room_id and rb.cancelled_at is null
      and rb.from_date < p_check_out and rb.to_date >= p_check_in
  ) into v_blocked;

  return query select not v_blocked and v_occupied + p_guests <= v_capacity,
    v_occupied, v_capacity, v_blocked;
end;
$$;
revoke all on function public.get_staff_room_availability(text,date,date,uuid,integer) from public, anon;
grant execute on function public.get_staff_room_availability(text,date,date,uuid,integer) to authenticated;

create or replace function public.create_staff_booking(p_booking jsonb)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_room_id text;
  v_check_in date;
  v_check_out date;
  v_guests integer;
  v_status text;
  v_source text;
  v_capacity integer;
  v_occupied integer;
  v_blocked boolean;
  v_rate integer;
  v_expiry_minutes integer;
  v_stay_nights integer;
  v_advance_months integer;
  v_total integer;
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  if p_booking is null or jsonb_typeof(p_booking) <> 'object' then
    raise exception 'Booking payload is required' using errcode = '22023';
  end if;
  perform public.expire_pending_bookings();
  select pending_expiry_minutes, stay_nights, advance_months
    into v_expiry_minutes, v_stay_nights, v_advance_months
  from public.booking_config where id = true;

  v_room_id := nullif(trim(p_booking->>'room_id'), '');
  v_check_in := nullif(p_booking->>'check_in', '')::date;
  v_check_out := nullif(p_booking->>'check_out', '')::date;
  v_guests := nullif(p_booking->>'guests', '')::integer;
  v_status := coalesce(p_booking->>'status', 'pending');
  v_source := coalesce(p_booking->>'source', 'phone');
  if nullif(trim(p_booking->>'fname'), '') is null
    or nullif(trim(p_booking->>'lname'), '') is null
    or nullif(trim(p_booking->>'phone'), '') is null
    or v_room_id is null then
    raise exception 'Name, phone, and room are required' using errcode = '22023';
  end if;
  if v_guests is null or v_guests < 1 then
    raise exception 'Guest count must be at least one' using errcode = '22023';
  end if;
  if v_status not in ('pending','confirmed','checked_in','checked_out','cancelled','no_show') then
    raise exception 'Invalid booking status' using errcode = '22023';
  end if;
  if v_source not in ('phone','walk_in') then
    raise exception 'Invalid booking source' using errcode = '22023';
  end if;
  if v_check_in is null or v_check_out is null
    or v_check_out <> v_check_in + v_stay_nights
    or v_check_in < current_date
    or v_check_in > (current_date + make_interval(months => v_advance_months))::date then
    raise exception 'Stay dates do not match the current booking policy'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_room_id, 0));
  select r.capacity, coalesce(r.adult1, r.adult2)
    into v_capacity, v_rate
  from public.room_units u join public.rooms r on r.id = u.category_id
  where u.id = v_room_id and u.active;
  if v_capacity is null then
    raise exception 'Room is not active or does not exist' using errcode = 'P0002';
  end if;
  if v_guests > v_capacity then
    raise exception 'Guest count exceeds room bed capacity' using errcode = '22023';
  end if;
  if v_rate is null or v_rate < 0 then
    raise exception 'Room price is not configured' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.room_blocks rb
    where rb.room_id = v_room_id and rb.cancelled_at is null
      and rb.from_date < v_check_out and rb.to_date >= v_check_in
  ) into v_blocked;
  if v_blocked then
    raise exception 'Room is closed for part of these dates' using errcode = '23P01';
  end if;

  select coalesce(sum(b.guests), 0)::integer into v_occupied
  from public.bookings b
  where b.room_id = v_room_id
    and b.status in ('pending','confirmed','checked_in')
    and (b.expires_at is null or b.expires_at > now())
    and b.check_in < v_check_out and b.check_out > v_check_in;
  if v_occupied + v_guests > v_capacity then
    raise exception 'Room capacity would be exceeded' using errcode = '23P01';
  end if;

  v_total := v_rate * v_guests * v_stay_nights;

  insert into public.bookings (
    ref, fname, lname, phone, email, room_id, check_in, check_out, guests,
    guest_details, treatments, notes, payment, payment_status, total, status,
    source, created_by, updated_by, updated_at, expires_at
  ) values (
    'STF-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    trim(p_booking->>'fname'), trim(p_booking->>'lname'), trim(p_booking->>'phone'),
    nullif(trim(p_booking->>'email'), ''), v_room_id, v_check_in, v_check_out,
    v_guests, coalesce(p_booking->'guest_details', '[]'::jsonb),
    coalesce(array(select jsonb_array_elements_text(p_booking->'treatments')), '{}'),
    nullif(trim(p_booking->>'notes'), ''), coalesce(p_booking->>'payment', 'cash'),
    'unrecorded', v_total, v_status, v_source, auth.uid(), auth.uid(), now(),
    case when v_status = 'pending' then now() + make_interval(mins => v_expiry_minutes) else null end
  ) returning * into v_booking;
  return v_booking;
end;
$$;
revoke all on function public.create_staff_booking(jsonb) from public, anon;
revoke all on function public.create_staff_booking(jsonb) from public, anon, authenticated;

create or replace function public.update_staff_booking(p_booking_id uuid, p_booking jsonb)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.bookings%rowtype;
  v_booking public.bookings%rowtype;
  v_room_id text;
  v_check_in date;
  v_check_out date;
  v_guests integer;
  v_status text;
  v_capacity integer;
  v_occupied integer;
  v_blocked boolean;
  v_rate integer;
  v_expiry_minutes integer;
  v_stay_nights integer;
  v_advance_months integer;
  v_adjust boolean;
  v_reason text;
  v_total integer;
  v_lock_room text;
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  perform public.expire_pending_bookings();
  select pending_expiry_minutes, stay_nights, advance_months
    into v_expiry_minutes, v_stay_nights, v_advance_months
  from public.booking_config where id = true;
  select * into v_old from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  v_room_id := coalesce(nullif(trim(p_booking->>'room_id'), ''), v_old.room_id);
  v_check_in := coalesce(nullif(p_booking->>'check_in', '')::date, v_old.check_in);
  v_check_out := coalesce(nullif(p_booking->>'check_out', '')::date, v_old.check_out);
  v_guests := coalesce(nullif(p_booking->>'guests', '')::integer, v_old.guests);
  v_status := coalesce(p_booking->>'status', v_old.status);
  v_adjust := coalesce((p_booking->>'adjust_price')::boolean, false);
  v_reason := nullif(trim(p_booking->>'price_adjustment_reason'), '');
  if v_adjust and not public.is_workspace_manager() then
    raise exception 'Manager access required for booking price adjustments'
      using errcode = '42501';
  end if;

  if v_status not in ('pending','confirmed','checked_in','checked_out','cancelled','no_show') then
    raise exception 'Invalid booking status' using errcode = '22023';
  end if;
  if v_guests < 1 then
    raise exception 'Guest count must be at least one' using errcode = '22023';
  end if;
  if v_check_in is distinct from v_old.check_in
    or v_check_out is distinct from v_old.check_out then
    if v_check_out <> v_check_in + v_stay_nights
      or v_check_in < current_date
      or v_check_in > (current_date + make_interval(months => v_advance_months))::date then
      raise exception 'Stay dates do not match the current booking policy'
        using errcode = '22023';
    end if;
  end if;

  for v_lock_room in
    select distinct x from unnest(array[v_old.room_id, v_room_id]) x order by x
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_lock_room, 0));
  end loop;

  select r.capacity, coalesce(r.adult1, r.adult2)
    into v_capacity, v_rate
  from public.room_units u join public.rooms r on r.id = u.category_id
  where u.id = v_room_id and u.active;
  if v_capacity is null then
    raise exception 'Room is not active or does not exist' using errcode = 'P0002';
  end if;
  if v_guests > v_capacity then
    raise exception 'Guest count exceeds room bed capacity' using errcode = '22023';
  end if;

  if v_status in ('pending','confirmed','checked_in') then
    select exists (
      select 1 from public.room_blocks rb
      where rb.room_id = v_room_id and rb.cancelled_at is null
        and rb.from_date < v_check_out and rb.to_date >= v_check_in
    ) into v_blocked;
    if v_blocked then
      raise exception 'Room is closed for part of these dates' using errcode = '23P01';
    end if;

    select coalesce(sum(b.guests), 0)::integer into v_occupied
    from public.bookings b
    where b.room_id = v_room_id and b.id <> p_booking_id
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and b.check_in < v_check_out and b.check_out > v_check_in;
    if v_occupied + v_guests > v_capacity then
      raise exception 'Room capacity would be exceeded' using errcode = '23P01';
    end if;
  end if;

  if v_adjust then
    if v_reason is null then
      raise exception 'A reason is required to adjust the agreed price' using errcode = '22023';
    end if;
    if v_rate is null or v_rate < 0 then
      raise exception 'Room price is not configured' using errcode = '22023';
    end if;
    v_total := v_rate * v_guests * v_stay_nights;
  else
    v_total := v_old.total;
  end if;

  perform set_config('app.booking_change_reason', coalesce(v_reason, ''), true);

  update public.bookings set
    fname = coalesce(nullif(trim(p_booking->>'fname'), ''), v_old.fname),
    lname = coalesce(nullif(trim(p_booking->>'lname'), ''), v_old.lname),
    phone = coalesce(nullif(trim(p_booking->>'phone'), ''), v_old.phone),
    email = case when p_booking ? 'email' then nullif(trim(p_booking->>'email'), '') else v_old.email end,
    room_id = v_room_id,
    check_in = v_check_in,
    check_out = v_check_out,
    guests = v_guests,
    notes = case when p_booking ? 'notes' then nullif(trim(p_booking->>'notes'), '') else v_old.notes end,
    status = v_status,
    total = v_total,
    price_adjustment_reason = case when v_adjust then v_reason else v_old.price_adjustment_reason end,
    cancellation_reason = case when p_booking ? 'cancellation_reason'
      then nullif(trim(p_booking->>'cancellation_reason'), '') else v_old.cancellation_reason end,
    expires_at = case
      when v_status <> 'pending' then null
      when v_old.status <> 'pending' or v_old.expires_at is null
        then now() + make_interval(mins => v_expiry_minutes)
      else v_old.expires_at
    end
  where id = p_booking_id
  returning * into v_booking;
  perform set_config('app.booking_change_reason', '', true);
  return v_booking;
end;
$$;
revoke all on function public.update_staff_booking(uuid,jsonb) from public, anon;
grant execute on function public.update_staff_booking(uuid,jsonb) to authenticated;

-- Serialize room closures against reservations, and reject a closure that
-- conflicts with an existing active stay. Checkout is exclusive; block end
-- dates are inclusive, matching the existing room-block UI.
create or replace function public.guard_room_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Room blocks cannot be deleted; cancel them instead'
      using errcode = '42501';
  end if;
  if new.cancelled_at is not null then
    new.cancelled_by := coalesce(new.cancelled_by, auth.uid());
    return new;
  end if;
  if new.to_date < new.from_date then
    raise exception 'Block end date must not precede its start date' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.room_id, 0));
  if not exists (
    select 1 from public.room_units u where u.id = new.room_id and u.active
  ) then
    raise exception 'Room is not active in the inventory' using errcode = '22023';
  end if;
  perform public.expire_pending_bookings();
  if exists (
    select 1 from public.bookings b
    where b.room_id = new.room_id
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and b.check_in < new.to_date + 1 and b.check_out > new.from_date
  ) then
    raise exception 'Cannot close a room while active reservations overlap' using errcode = '23P01';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_room_block() from public, anon, authenticated;
drop trigger if exists room_block_guard_trigger on public.room_blocks;
create trigger room_block_guard_trigger
  before insert or update or delete on public.room_blocks
  for each row execute function public.guard_room_block();

-- Role assignment / expiry configuration stays privileged. The public booking
-- API is intentionally not changed by this migration.

-- Individual-bed allocation extension. This is additive and preserves all
-- existing booking rows; unassigned legacy bookings are explicitly flagged.
alter table public.bookings
  add column if not exists actual_check_in_at timestamptz,
  add column if not exists actual_check_out_at timestamptz,
  add column if not exists bed_allocation_required boolean not null default false,
  add column if not exists bed_gender_review_required boolean not null default false;

create table if not exists public.room_beds (
  id text primary key,
  room_id text not null references public.room_units(id) on update cascade,
  bed_number integer not null check (bed_number > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (room_id, bed_number)
);

create table if not exists public.booking_bed_assignments (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  bed_id text not null references public.room_beds(id) on update cascade,
  guest_gender text not null check (guest_gender in ('female','male','unknown')),
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null,
  released_at timestamptz,
  released_by uuid references auth.users(id) on delete set null,
  actual_check_in_at timestamptz,
  actual_check_out_at timestamptz
);
create index if not exists booking_bed_assignments_booking_idx
  on public.booking_bed_assignments (booking_id, assigned_at desc);
create index if not exists booking_bed_assignments_bed_active_idx
  on public.booking_bed_assignments (bed_id) where released_at is null;

create table if not exists public.booking_bed_assignment_audit (
  id bigint generated always as identity primary key,
  assignment_id bigint not null,
  booking_id uuid not null,
  bed_id text not null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_gender text,
  new_gender text,
  created_at timestamptz not null default now()
);
create index if not exists booking_bed_assignment_audit_booking_idx
  on public.booking_bed_assignment_audit (booking_id, created_at desc);

insert into public.room_beds (id, room_id, bed_number)
select u.id || '-B' || generated.bed_number::text, u.id, generated.bed_number
from public.room_units u
join public.rooms r on r.id = u.category_id
cross join lateral generate_series(1, r.capacity) as generated(bed_number)
where u.active and r.capacity is not null
on conflict (id) do nothing;

update public.bookings b
set bed_allocation_required = true
where b.status in ('pending','confirmed','checked_in')
  and (
    select count(*) from public.booking_bed_assignments a
    where a.booking_id = b.id and a.released_at is null
  ) <> coalesce(b.guests, 0);

update public.bookings b
set bed_gender_review_required = true
where b.status in ('pending','confirmed','checked_in')
  and (
    b.bed_allocation_required
    or (
      select count(distinct a.guest_gender)
      from public.booking_bed_assignments a
      where a.booking_id = b.id and a.released_at is null
    ) <> 1
    or exists (
      select 1
      from public.booking_bed_assignments a
      where a.booking_id = b.id and a.released_at is null
        and a.guest_gender = 'unknown'
    )
    or exists (
      select 1
      from public.booking_bed_assignments a
      join public.booking_bed_assignments other_a
        on other_a.guest_gender is distinct from a.guest_gender
      join public.bookings other_b on other_b.id = other_a.booking_id
      where a.booking_id = b.id and a.released_at is null
        and other_a.released_at is null
        and other_b.id <> b.id
        and other_b.room_id = b.room_id
        and other_b.status in ('pending','confirmed','checked_in')
        and (other_b.expires_at is null or other_b.expires_at > now())
        and (
          (other_b.check_in < b.check_out and other_b.check_out > b.check_in)
          or b.status = 'checked_in' and b.actual_check_out_at is null
          or other_b.status = 'checked_in' and other_b.actual_check_out_at is null
        )
    )
  );

alter table public.room_beds enable row level security;
drop policy if exists "Staff read room beds" on public.room_beds;
create policy "Staff read room beds"
  on public.room_beds for select to authenticated
  using (public.has_workspace_role(array['staff']));
revoke all on public.room_beds from anon, authenticated;
grant select on public.room_beds to authenticated;

alter table public.booking_bed_assignments enable row level security;
drop policy if exists "Staff read bed assignments" on public.booking_bed_assignments;
create policy "Staff read bed assignments"
  on public.booking_bed_assignments for select to authenticated
  using (public.has_workspace_role(array['staff']));
revoke all on public.booking_bed_assignments from anon, authenticated;
grant select on public.booking_bed_assignments to authenticated;

alter table public.booking_bed_assignment_audit enable row level security;
drop policy if exists "Managers read bed assignment audit" on public.booking_bed_assignment_audit;
create policy "Managers read bed assignment audit"
  on public.booking_bed_assignment_audit for select to authenticated
  using (public.is_workspace_manager());
revoke all on public.booking_bed_assignment_audit from anon, authenticated;
grant select on public.booking_bed_assignment_audit to authenticated;

create or replace function public.audit_bed_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Bed assignments cannot be deleted; release them instead'
      using errcode = '42501';
  end if;
  insert into public.booking_bed_assignment_audit (
    assignment_id, booking_id, bed_id, actor_id, action, old_gender, new_gender
  ) values (
    new.id, new.booking_id, new.bed_id, auth.uid(),
    case when tg_op = 'INSERT' then 'assigned'
      when old.released_at is null and new.released_at is not null then 'released'
      when old.guest_gender is distinct from new.guest_gender then 'gender_updated'
      else 'updated' end,
    case when tg_op = 'INSERT' then null else old.guest_gender end,
    new.guest_gender
  );
  return new;
end;
$$;
revoke all on function public.audit_bed_assignment_change() from public, anon, authenticated;
drop trigger if exists booking_bed_assignment_audit_trigger on public.booking_bed_assignments;
create trigger booking_bed_assignment_audit_trigger
  before insert or update or delete on public.booking_bed_assignments
  for each row execute function public.audit_bed_assignment_change();

create or replace function public.expire_pending_bookings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expired_ids uuid[];
  v_count integer;
begin
  with expired as (
    update public.bookings b
    set status = 'cancelled',
        expired_at = now(),
        cancellation_reason = 'Pending reservation expired automatically',
        expires_at = null
    where b.status = 'pending'
      and b.expires_at is not null
      and b.expires_at <= now()
    returning b.id
  )
  select array_agg(id) into v_expired_ids from expired;

  v_count := coalesce(cardinality(v_expired_ids), 0);
  if v_count > 0 then
    update public.booking_bed_assignments
    set released_at = now(), released_by = null
    where booking_id = any(v_expired_ids) and released_at is null;
  end if;
  return v_count;
end;
$$;
revoke all on function public.expire_pending_bookings() from public, anon, authenticated;
grant execute on function public.expire_pending_bookings() to service_role;

create or replace function public.seed_room_beds()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room record;
  v_capacity integer;
begin
  if tg_table_name = 'rooms' then
    for v_room in
      select u.id from public.room_units u where u.category_id = new.id and u.active
    loop
      insert into public.room_beds (id, room_id, bed_number)
      select v_room.id || '-B' || n::text, v_room.id, n
      from generate_series(1, new.capacity) n
      on conflict (id) do nothing;
    end loop;
    update public.room_beds rb set active = rb.bed_number <= new.capacity
    where rb.room_id in (
      select u.id from public.room_units u where u.category_id = new.id and u.active
    );
  else
    select r.capacity into v_capacity from public.rooms r where r.id = new.category_id;
    if v_capacity is not null then
      insert into public.room_beds (id, room_id, bed_number)
      select new.id || '-B' || n::text, new.id, n
      from generate_series(1, v_capacity) n
      on conflict (id) do nothing;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.seed_room_beds() from public, anon, authenticated;
drop trigger if exists room_units_seed_beds_trigger on public.room_units;
create trigger room_units_seed_beds_trigger
  after insert on public.room_units
  for each row execute function public.seed_room_beds();
drop trigger if exists rooms_seed_beds_trigger on public.rooms;
create trigger rooms_seed_beds_trigger
  after update of capacity on public.rooms
  for each row when (new.capacity is distinct from old.capacity)
  execute function public.seed_room_beds();

create or replace function public.guard_room_bed_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id text;
begin
  for v_room_id in
    select u.id from public.room_units u where u.category_id = new.id order by u.id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_room_id, 0));
  end loop;
  if new.capacity is null or new.capacity < 1 then
    raise exception 'Room capacity must be positive before inventory can be updated'
      using errcode = '22023';
  end if;
  if new.capacity < old.capacity and exists (
    select 1
    from public.bookings b
    join public.room_units u on u.category_id = new.id
    where b.bed_allocation_required
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and (b.room_id = u.id or b.room_id = u.category_id)
  ) then
    raise exception 'Cannot reduce capacity while an active booking needs bed allocation'
      using errcode = '23P01';
  end if;
  if new.capacity < old.capacity and exists (
    select 1
    from public.room_beds rb
    where rb.active and rb.bed_number > new.capacity
      and exists (
        select 1
        from public.booking_bed_assignments a
        join public.bookings b on b.id = a.booking_id
        where a.bed_id = rb.id and a.released_at is null
          and b.status in ('pending','confirmed','checked_in')
      )
  ) then
    raise exception 'Cannot reduce capacity while beds are assigned to active reservations'
      using errcode = '23P01';
  end if;
  if new.capacity < old.capacity then
    update public.room_beds rb set active = rb.bed_number <= new.capacity
    where rb.room_id in (
      select u.id from public.room_units u where u.category_id = new.id
    );
  end if;
  return new;
end;
$$;
revoke all on function public.guard_room_bed_capacity() from public, anon, authenticated;
drop trigger if exists rooms_guard_bed_capacity_trigger on public.rooms;
create trigger rooms_guard_bed_capacity_trigger
  before update of capacity on public.rooms
  for each row when (new.capacity is distinct from old.capacity)
  execute function public.guard_room_bed_capacity();

create or replace function public.get_public_bed_availability(
  p_check_in date,
  p_check_out date,
  p_gender text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Ulaanbaatar')::date;
  v_stay_nights integer;
  v_advance_months integer;
  v_result jsonb;
begin
  if p_check_in is null or p_check_out is null or p_gender is null
    or p_gender not in ('female','male')
    or p_check_out <= p_check_in then
    raise exception 'Valid selected dates are required' using errcode = '22023';
  end if;
  select c.stay_nights, c.advance_months
    into v_stay_nights, v_advance_months
  from public.booking_config c where c.id = true;
  if p_check_out <> p_check_in + v_stay_nights
    or p_check_in < v_today
    or p_check_in > (v_today + make_interval(months => v_advance_months))::date then
    raise exception 'Stay dates do not match the current booking policy'
      using errcode = '22023';
  end if;
  perform public.expire_pending_bookings();

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'room_id', u.id,
      'category_id', u.category_id,
      'beds', bed_rows.beds,
      'allocation_required', bed_rows.allocation_required,
      'gender_for_dates', bed_rows.gender_for_dates,
      'gender_conflict', bed_rows.gender_conflict,
      'gender_matches_selection', bed_rows.gender_matches_selection
    ) order by u.id
  ), '[]'::jsonb)
  into v_result
  from public.room_units u
  cross join lateral (
    select
      coalesce(jsonb_agg(
        jsonb_build_object(
          'bed_id', rb.id,
          'state',
            case
              when exists (
                select 1 from public.room_blocks bl
                where bl.room_id = u.id and bl.cancelled_at is null
                  and bl.from_date < p_check_out and bl.to_date >= p_check_in
              ) then 'closed'
              when exists (
                select 1 from public.bookings legacy
                where legacy.bed_allocation_required
                  and legacy.status in ('pending','confirmed','checked_in')
                  and (legacy.expires_at is null or legacy.expires_at > now())
                  and (legacy.room_id = u.id or legacy.room_id = u.category_id)
                  and (
                    (legacy.check_in < p_check_out and legacy.check_out > p_check_in)
                    or (legacy.status = 'checked_in' and legacy.actual_check_out_at is null)
                  )
              ) then 'allocation_required'
              when room_gender.gender_conflict
                then 'gender_conflict'
              when selected_assignment.booking_id is not null then 'reserved_for_dates'
              when current_assignment.booking_id is not null then 'occupied_now'
              when cardinality(room_gender.genders) = 1
                and room_gender.genders[1] <> p_gender then 'gender_restricted'
              else 'available'
            end,
          'occupied_now', current_assignment.booking_id is not null,
          'occupant_gender', case when current_assignment.booking_id is not null
            then current_assignment.guest_gender else null end,
          'departure_status', case
            when current_assignment.booking_id is null then null
            when current_assignment.check_out < v_today then 'overdue'
            when current_assignment.check_out = v_today then 'leaves_today'
            else 'scheduled' end,
          'days_remaining', case
            when current_assignment.booking_id is null or current_assignment.check_out < v_today then null
            else current_assignment.check_out - v_today end
        ) order by rb.bed_number
      ) filter (where rb.active), '[]'::jsonb) as beds,
      coalesce(room_allocation.allocation_required, false) as allocation_required,
      case
        when coalesce(room_allocation.allocation_required, false)
          or room_gender.gender_conflict then null
        when cardinality(room_gender.genders) = 1 then room_gender.genders[1]
        else null
      end as gender_for_dates,
      coalesce(room_gender.gender_conflict, false) as gender_conflict,
      not coalesce(room_allocation.allocation_required, false)
        and not coalesce(room_gender.gender_conflict, false)
        and (
          cardinality(room_gender.genders) is null
          or room_gender.genders[1] = p_gender
        ) as gender_matches_selection
    from public.room_beds rb
    left join lateral (
      select exists (
        select 1 from public.bookings legacy
        where legacy.bed_allocation_required
          and legacy.status in ('pending','confirmed','checked_in')
          and (legacy.expires_at is null or legacy.expires_at > now())
          and (legacy.room_id = u.id or legacy.room_id = u.category_id)
          and (
            (legacy.check_in < p_check_out and legacy.check_out > p_check_in)
            or (legacy.status = 'checked_in' and legacy.actual_check_out_at is null)
          )
      ) as allocation_required
    ) room_allocation on true
    left join lateral (
      select
        array_agg(distinct a.guest_gender) as genders,
        coalesce(bool_or(b.bed_gender_review_required), false)
          or coalesce(cardinality(array_agg(distinct a.guest_gender)) > 1, false)
          or coalesce('unknown' = any(array_agg(distinct a.guest_gender)), false)
          as gender_conflict
      from public.booking_bed_assignments a
      join public.bookings b on b.id = a.booking_id
      where a.released_at is null
        and b.room_id = u.id
        and b.status in ('pending','confirmed','checked_in')
        and (b.expires_at is null or b.expires_at > now())
        and (
          (b.check_in < p_check_out and b.check_out > p_check_in)
          or (b.status = 'checked_in' and b.actual_check_out_at is null)
        )
    ) room_gender on true
    left join lateral (
      select b.id as booking_id, a.guest_gender, b.check_out
      from public.booking_bed_assignments a
      join public.bookings b on b.id = a.booking_id
      where a.bed_id = rb.id and a.released_at is null
        and b.status = 'checked_in' and b.actual_check_out_at is null
      order by a.assigned_at desc limit 1
    ) current_assignment on true
    left join lateral (
      select b.id as booking_id
      from public.booking_bed_assignments a
      join public.bookings b on b.id = a.booking_id
      where a.bed_id = rb.id and a.released_at is null
        and b.status in ('pending','confirmed','checked_in')
        and (b.expires_at is null or b.expires_at > now())
        and (
          (b.check_in < p_check_out and b.check_out > p_check_in)
          or (b.status = 'checked_in' and b.actual_check_out_at is null)
        )
      order by a.assigned_at desc limit 1
    ) selected_assignment on true
    where rb.room_id = u.id
  ) bed_rows
  where u.active;
  return v_result;
end;
$$;
revoke all on function public.get_public_bed_availability(date,date,text) from public, anon, authenticated;
grant execute on function public.get_public_bed_availability(date,date,text) to service_role;

create or replace function public.get_public_booking_policy()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'stay_nights', c.stay_nights,
    'advance_months', c.advance_months
  )
  from public.booking_config c
  where c.id = true;
$$;
revoke all on function public.get_public_booking_policy() from public, anon, authenticated;
grant execute on function public.get_public_booking_policy() to service_role;

create or replace function public.get_staff_bed_availability(
  p_room_id text,
  p_check_in date,
  p_check_out date,
  p_exclude_booking uuid default null,
  p_guest_genders jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Ulaanbaatar')::date;
  v_stay_nights integer;
  v_advance_months integer;
  v_closed boolean;
  v_legacy boolean;
  v_resolving_legacy boolean;
  v_room_id text;
  v_available_beds jsonb;
  v_beds jsonb;
  v_requested_genders text[];
  v_existing_genders text[];
  v_gender_conflict boolean := false;
  v_available_count integer;
  v_guest_count integer;
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  if p_room_id is null or p_check_in is null or p_check_out is null
    or jsonb_typeof(coalesce(p_guest_genders, '[]'::jsonb)) <> 'array' then
    raise exception 'Valid room, dates, and guest genders are required' using errcode = '22023';
  end if;
  select c.stay_nights, c.advance_months into v_stay_nights, v_advance_months
  from public.booking_config c where c.id = true;
  if p_check_out <> p_check_in + v_stay_nights then
    raise exception 'Stay duration does not match the current booking policy' using errcode = '22023';
  end if;
  if p_exclude_booking is null and (
    p_check_in < v_today
    or p_check_in > (v_today + make_interval(months => v_advance_months))::date
  ) then
    raise exception 'Stay dates do not match the current booking policy' using errcode = '22023';
  elsif p_exclude_booking is not null and not exists (
    select 1 from public.bookings b where b.id = p_exclude_booking
      and b.check_in = p_check_in and b.check_out = p_check_out
  ) and (p_check_in < v_today
    or p_check_in > (v_today + make_interval(months => v_advance_months))::date) then
    raise exception 'Changed stay dates are outside the current booking policy' using errcode = '22023';
  end if;
  perform public.expire_pending_bookings();

  select u.id into v_room_id
  from public.room_units u where u.id = p_room_id and u.active;
  if v_room_id is null then
    raise exception 'Room is not active or does not exist' using errcode = 'P0002';
  end if;

  select coalesce(b.bed_allocation_required, false) into v_resolving_legacy
  from public.bookings b where b.id = p_exclude_booking;
  v_resolving_legacy := coalesce(v_resolving_legacy, false);

  select exists (
    select 1 from public.room_blocks bl
    where bl.room_id = p_room_id and bl.cancelled_at is null
      and bl.from_date < p_check_out and bl.to_date >= p_check_in
  ) into v_closed;
  select exists (
    select 1 from public.bookings b
    join public.room_units u on u.id = p_room_id
    where b.bed_allocation_required
      and b.id is distinct from p_exclude_booking
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and (b.room_id = p_room_id or b.room_id = u.category_id)
      and b.check_in < p_check_out and b.check_out > p_check_in
  ) and not v_resolving_legacy into v_legacy;

  select coalesce(array_agg(value), '{}') into v_requested_genders
  from jsonb_array_elements_text(coalesce(p_guest_genders, '[]'::jsonb)) as values_(value)
  where value in ('female','male','unknown');
  if jsonb_array_length(coalesce(p_guest_genders, '[]'::jsonb)) <> coalesce(cardinality(v_requested_genders), 0) then
    raise exception 'Guest gender values must be female, male, or unknown' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct a.guest_gender), '{}') into v_existing_genders
  from public.booking_bed_assignments a
  join public.bookings b on b.id = a.booking_id
  where a.released_at is null and b.id is distinct from p_exclude_booking
    and b.room_id = p_room_id
    and b.status in ('pending','confirmed','checked_in')
    and (b.expires_at is null or b.expires_at > now())
    and (
      (b.check_in < p_check_out and b.check_out > p_check_in)
      or (b.status = 'checked_in' and b.actual_check_out_at is null)
    );
  if cardinality(v_requested_genders) > 0 then
    v_gender_conflict := 'unknown' = any(v_requested_genders)
      or cardinality(array(
        select distinct gender from unnest(v_requested_genders) as genders(gender)
      )) > 1;
    if cardinality(v_existing_genders) > 0 then
      v_gender_conflict := v_gender_conflict
      or 'unknown' = any(v_existing_genders)
      or cardinality(array(
        select distinct gender
        from unnest(v_requested_genders || v_existing_genders) as genders(gender)
      )) > 1;
    end if;
  end if;
  if exists (
    select 1 from public.bookings b
    where b.room_id = p_room_id and b.bed_gender_review_required
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and (
        (b.check_in < p_check_out and b.check_out > p_check_in)
        or (b.status = 'checked_in' and b.actual_check_out_at is null)
      )
  ) then
    v_gender_conflict := true;
  end if;

  select count(*)::integer into v_guest_count
  from jsonb_array_elements_text(coalesce(p_guest_genders, '[]'::jsonb));
  select count(*)::integer into v_available_count
  from public.room_beds rb
  where rb.room_id = p_room_id and rb.active
    and not v_closed and not v_legacy
    and not exists (
      select 1
      from public.booking_bed_assignments a
      join public.bookings b on b.id = a.booking_id
      where a.bed_id = rb.id and a.released_at is null
        and b.id is distinct from p_exclude_booking
        and b.status in ('pending','confirmed','checked_in')
        and (b.expires_at is null or b.expires_at > now())
        and (
          (b.check_in < p_check_out and b.check_out > p_check_in)
          or (b.status = 'checked_in' and b.actual_check_out_at is null)
        )
    );

  select coalesce(jsonb_agg(jsonb_build_object('bed_id', rb.id, 'label', rb.id, 'bed_number', rb.bed_number) order by rb.bed_number), '[]'::jsonb)
    into v_available_beds
  from public.room_beds rb
  where rb.room_id = p_room_id and rb.active and not v_closed and not v_legacy
    and not exists (
      select 1
      from public.booking_bed_assignments a
      join public.bookings b on b.id = a.booking_id
      where a.bed_id = rb.id and a.released_at is null
        and b.id is distinct from p_exclude_booking
        and b.status in ('pending','confirmed','checked_in')
        and (b.expires_at is null or b.expires_at > now())
        and (
          (b.check_in < p_check_out and b.check_out > p_check_in)
          or (b.status = 'checked_in' and b.actual_check_out_at is null)
        )
    );

  select coalesce(jsonb_agg(jsonb_build_object(
    'bed_id', rb.id,
    'label', rb.id,
    'bed_number', rb.bed_number,
    'state', case
      when v_closed then 'closed'
      when v_legacy then 'allocation_required'
      when current_assignment.booking_id is not null then 'occupied_now'
      when assignment.booking_id is not null then 'reserved_for_dates'
      else 'available' end,
    'guest_gender', coalesce(current_assignment.guest_gender, assignment.guest_gender),
    'booking_id', coalesce(current_assignment.booking_id, assignment.booking_id),
    'check_out', coalesce(current_assignment.check_out, assignment.check_out)
  ) order by rb.bed_number) filter (where rb.active), '[]'::jsonb) into v_beds
  from public.room_beds rb
  left join lateral (
    select b.id as booking_id, a.guest_gender, b.check_out
    from public.booking_bed_assignments a
    join public.bookings b on b.id = a.booking_id
    where a.bed_id = rb.id and a.released_at is null
      and b.status = 'checked_in' and b.actual_check_out_at is null
    order by a.assigned_at desc limit 1
  ) current_assignment on true
  left join lateral (
    select b.id as booking_id, a.guest_gender, b.check_out
    from public.booking_bed_assignments a
    join public.bookings b on b.id = a.booking_id
    where a.bed_id = rb.id and a.released_at is null
      and b.id is distinct from p_exclude_booking
      and b.status in ('pending','confirmed','checked_in')
      and (b.expires_at is null or b.expires_at > now())
      and b.check_in < p_check_out and b.check_out > p_check_in
    order by a.assigned_at desc limit 1
  ) assignment on true
  where rb.room_id = p_room_id;

  return jsonb_build_object(
    'available', not v_closed and not v_legacy and not v_gender_conflict
      and v_available_count >= greatest(v_guest_count, 1),
    'blocked', v_closed,
    'allocation_required', v_legacy,
    'gender_conflict', v_gender_conflict,
    'capacity', (select count(*) from public.room_beds rb where rb.room_id = p_room_id and rb.active),
    'available_count', v_available_count,
    'available_beds', v_available_beds,
    'beds', v_beds
  );
end;
$$;
revoke all on function public.get_staff_bed_availability(text,date,date,uuid,jsonb) from public, anon;
grant execute on function public.get_staff_bed_availability(text,date,date,uuid,jsonb) to authenticated;
revoke all on function public.get_staff_room_availability(text,date,date,uuid,integer) from public, anon, authenticated;

create or replace function public.create_staff_bed_booking(p_booking jsonb)
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
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
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
    or v_source not in ('phone','walk_in') then
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
    source, created_by, updated_by, updated_at, expires_at,
    bed_allocation_required, actual_check_in_at, actual_check_out_at
  ) values (
    'STF-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    trim(p_booking->>'fname'), trim(p_booking->>'lname'), trim(p_booking->>'phone'),
    nullif(trim(p_booking->>'email'), ''), v_room_id, v_check_in, v_check_out,
    v_guests, coalesce(p_booking->'guest_details', '[]'::jsonb),
    coalesce(array(select jsonb_array_elements_text(p_booking->'treatments')), '{}'),
    nullif(trim(p_booking->>'notes'), ''), coalesce(p_booking->>'payment', 'cash'),
    'unrecorded', v_rate * v_guests * v_stay_nights, v_status, v_source,
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
revoke all on function public.create_staff_booking(jsonb) from public, anon, authenticated;
revoke all on function public.create_staff_bed_booking(jsonb) from public, anon;
grant execute on function public.create_staff_bed_booking(jsonb) to authenticated;

create or replace function public.update_staff_bed_booking(p_booking_id uuid, p_booking jsonb)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.bookings%rowtype;
  v_booking public.bookings%rowtype;
  v_room_id text;
  v_check_in date;
  v_check_out date;
  v_guests integer;
  v_status text;
  v_expiry integer;
  v_stay_nights integer;
  v_advance_months integer;
  v_rate integer;
  v_capacity integer;
  v_bed_ids text[];
  v_genders text[];
  v_adjust boolean;
  v_reason text;
  v_total integer;
  v_lock_room text;
  v_has_new_assignments boolean := jsonb_typeof(p_booking->'bed_assignments') = 'array';
  v_existing_count integer;
begin
  if not public.has_workspace_role(array['staff']) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  if p_booking is null or jsonb_typeof(p_booking) <> 'object' then
    raise exception 'Booking update is required' using errcode = '22023';
  end if;
  if p_booking ? 'bed_assignments'
    and jsonb_typeof(p_booking->'bed_assignments') is distinct from 'array' then
    raise exception 'Bed assignments must be an array' using errcode = '22023';
  end if;
  perform public.expire_pending_bookings();
  select pending_expiry_minutes, stay_nights, advance_months
    into v_expiry, v_stay_nights, v_advance_months
  from public.booking_config where id = true;
  select * into v_old from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found' using errcode = 'P0002'; end if;

  v_room_id := coalesce(nullif(trim(p_booking->>'room_id'), ''), v_old.room_id);
  v_check_in := coalesce(nullif(p_booking->>'check_in', '')::date, v_old.check_in);
  v_check_out := coalesce(nullif(p_booking->>'check_out', '')::date, v_old.check_out);
  v_guests := coalesce(nullif(p_booking->>'guests', '')::integer, v_old.guests);
  v_status := coalesce(p_booking->>'status', v_old.status);
  v_adjust := coalesce((p_booking->>'adjust_price')::boolean, false);
  v_reason := nullif(trim(p_booking->>'price_adjustment_reason'), '');
  if v_adjust and not public.is_workspace_manager() then
    raise exception 'Manager access required for booking price adjustments'
      using errcode = '42501';
  end if;
  if v_status not in ('pending','confirmed','checked_in','checked_out','cancelled','no_show')
    or v_guests < 1 then
    raise exception 'Invalid booking status or guest count' using errcode = '22023';
  end if;
  if (v_status = 'checked_out' and v_old.status not in ('checked_in','checked_out'))
    or (v_old.status = 'checked_out' and v_status <> 'checked_out')
    or (v_old.status = 'checked_in' and v_status in ('pending','confirmed','cancelled','no_show')) then
    raise exception 'Record actual checkout before changing an in-house guest, and do not reopen checked-out bookings'
      using errcode = '22023';
  end if;
  if (v_check_in is distinct from v_old.check_in or v_check_out is distinct from v_old.check_out)
    and (v_check_out <> v_check_in + v_stay_nights
      or v_check_in < (now() at time zone 'Asia/Ulaanbaatar')::date
      or v_check_in > ((now() at time zone 'Asia/Ulaanbaatar')::date + make_interval(months => v_advance_months))::date) then
    raise exception 'Stay dates do not match the current booking policy' using errcode = '22023';
  end if;
  for v_lock_room in select distinct x from unnest(array[v_old.room_id, v_room_id]) x order by x
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_lock_room, 0));
  end loop;

  select count(*)::integer into v_existing_count
  from public.booking_bed_assignments a
  where a.booking_id = p_booking_id and a.released_at is null;
  if v_has_new_assignments then
    if jsonb_array_length(p_booking->'bed_assignments') <> v_guests then
      raise exception 'Assign one distinct bed and gender per guest' using errcode = '22023';
    end if;
    select array_agg(item->>'bed_id'), array_agg(item->>'guest_gender')
      into v_bed_ids, v_genders
    from jsonb_array_elements(p_booking->'bed_assignments') as assignments(item);
    if cardinality(v_bed_ids) <> cardinality(array(
        select distinct bed_id from unnest(v_bed_ids) as beds(bed_id)
      ))
      or exists (
        select 1 from unnest(v_genders) as genders(gender)
        where gender is null or gender not in ('female','male','unknown')
      ) then
      raise exception 'Bed IDs must be distinct and each guest needs a valid gender' using errcode = '22023';
    end if;
    if exists (
      select 1 from unnest(v_bed_ids) selected(bed_id)
      left join public.room_beds rb on rb.id = selected.bed_id
      where rb.id is null or rb.room_id <> v_room_id or not rb.active
    ) then
      raise exception 'Every assigned bed must belong to this active room' using errcode = '22023';
    end if;
  else
    select array_agg(a.bed_id), array_agg(a.guest_gender)
      into v_bed_ids, v_genders
    from public.booking_bed_assignments a
    where a.booking_id = p_booking_id and a.released_at is null;
  end if;
  if not v_has_new_assignments
    and (v_room_id is distinct from v_old.room_id or v_guests <> v_old.guests)
    and v_status in ('pending','confirmed','checked_in') then
    raise exception 'Changing room or guest count requires explicit bed assignments' using errcode = '22023';
  end if;
  if v_status in ('pending','confirmed','checked_in')
    and not v_has_new_assignments and v_existing_count <> v_guests then
    raise exception 'This booking needs explicit bed allocation before it can remain active'
      using errcode = '22023';
  end if;
  if v_status in ('pending','confirmed','checked_in')
    and (
      cardinality(coalesce(v_bed_ids, '{}')) <> v_guests
      or cardinality(coalesce(v_genders, '{}')) <> v_guests
      or 'unknown' = any(coalesce(v_genders, '{}'))
      or cardinality(array(
        select distinct gender from unnest(coalesce(v_genders, '{}')) as genders(gender)
      )) <> 1
    ) then
    raise exception 'Every guest in a room must have an assigned bed and the same known gender'
      using errcode = '22023';
  end if;

  select r.capacity, coalesce(r.adult1, r.adult2)
    into v_capacity, v_rate
  from public.room_units u join public.rooms r on r.id = u.category_id
  where u.id = v_room_id and u.active;
  if v_capacity is null or v_guests > v_capacity then
    raise exception 'Room is not active or guest count exceeds bed capacity' using errcode = '22023';
  end if;
  if v_status in ('pending','confirmed','checked_in') then
    if exists (
      select 1 from public.room_blocks bl
      where bl.room_id = v_room_id and bl.cancelled_at is null
        and bl.from_date < v_check_out and bl.to_date >= v_check_in
    ) then raise exception 'Room is closed for part of these dates' using errcode = '23P01'; end if;
    if exists (
      select 1 from public.bookings legacy
      join public.room_units u on u.id = v_room_id
      where legacy.id <> p_booking_id and legacy.bed_allocation_required
        and legacy.status in ('pending','confirmed','checked_in')
        and (legacy.expires_at is null or legacy.expires_at > now())
        and (legacy.room_id = v_room_id or legacy.room_id = u.category_id)
        and legacy.check_in < v_check_out and legacy.check_out > v_check_in
    ) then raise exception 'Unallocated historical bookings must be resolved first' using errcode = '23P01'; end if;
    if exists (
      select 1 from public.bookings other
      where other.id <> p_booking_id and other.room_id = v_room_id
        and other.bed_gender_review_required
        and other.status in ('pending','confirmed','checked_in')
        and (other.expires_at is null or other.expires_at > now())
        and (
          (other.check_in < v_check_out and other.check_out > v_check_in)
          or (other.status = 'checked_in' and other.actual_check_out_at is null)
        )
    ) then
      raise exception 'An overlapping reservation has unresolved gender details'
        using errcode = '23P01';
    end if;
    if cardinality(coalesce(v_bed_ids, '{}')) > 0 and exists (
      select 1 from unnest(v_bed_ids) selected(bed_id)
      join public.booking_bed_assignments a on a.bed_id = selected.bed_id and a.released_at is null
      join public.bookings b on b.id = a.booking_id
      where b.id <> p_booking_id and b.status in ('pending','confirmed','checked_in')
        and (b.expires_at is null or b.expires_at > now())
        and (
          (b.check_in < v_check_out and b.check_out > v_check_in)
          or (b.status = 'checked_in' and b.actual_check_out_at is null)
        )
    ) then raise exception 'One or more selected beds are already reserved' using errcode = '23P01'; end if;
    if cardinality(coalesce(v_bed_ids, '{}')) > 0 and exists (
      select 1 from public.booking_bed_assignments a
      join public.bookings b on b.id = a.booking_id
      where a.released_at is null and b.id <> p_booking_id and b.room_id = v_room_id
        and b.status in ('pending','confirmed','checked_in')
        and (b.expires_at is null or b.expires_at > now())
        and (
          (b.check_in < v_check_out and b.check_out > v_check_in)
          or (b.status = 'checked_in' and b.actual_check_out_at is null)
        )
        and (a.guest_gender = 'unknown' or a.guest_gender <> all(v_genders))
    ) then raise exception 'Separate reservations sharing a room must have the same known gender' using errcode = '23P01'; end if;
  end if;

  if v_adjust then
    if v_reason is null or v_rate is null then
      raise exception 'A valid room rate and price adjustment reason are required' using errcode = '22023';
    end if;
    v_total := v_rate * v_guests * v_stay_nights;
  else
    v_total := v_old.total;
  end if;
  perform set_config('app.booking_change_reason', coalesce(v_reason, ''), true);
  update public.bookings set
    fname = coalesce(nullif(trim(p_booking->>'fname'), ''), v_old.fname),
    lname = coalesce(nullif(trim(p_booking->>'lname'), ''), v_old.lname),
    phone = coalesce(nullif(trim(p_booking->>'phone'), ''), v_old.phone),
    email = case when p_booking ? 'email' then nullif(trim(p_booking->>'email'), '') else v_old.email end,
    room_id = v_room_id, check_in = v_check_in, check_out = v_check_out, guests = v_guests,
    notes = case when p_booking ? 'notes' then nullif(trim(p_booking->>'notes'), '') else v_old.notes end,
    status = v_status, total = v_total,
    bed_allocation_required = case when v_has_new_assignments then false
      when v_status in ('cancelled','checked_out','no_show') then v_old.bed_allocation_required
      else v_old.bed_allocation_required end,
    bed_gender_review_required = case
      when v_status in ('pending','confirmed','checked_in') then false
      else v_old.bed_gender_review_required end,
    actual_check_in_at = case
      when v_status = 'checked_in' and v_old.status <> 'checked_in' then now()
      else v_old.actual_check_in_at end,
    actual_check_out_at = case
      when v_status = 'checked_out' and v_old.status <> 'checked_out' then now()
      else v_old.actual_check_out_at end,
    price_adjustment_reason = case when v_adjust then v_reason else v_old.price_adjustment_reason end,
    cancellation_reason = case when p_booking ? 'cancellation_reason'
      then nullif(trim(p_booking->>'cancellation_reason'), '') else v_old.cancellation_reason end,
    expires_at = case
      when v_status <> 'pending' then null
      when v_old.status <> 'pending' or v_old.expires_at is null
        then now() + make_interval(mins => v_expiry)
      else v_old.expires_at end
  where id = p_booking_id returning * into v_booking;

  if v_has_new_assignments then
    update public.booking_bed_assignments
      set released_at = now(), released_by = auth.uid()
    where booking_id = p_booking_id and released_at is null;
    insert into public.booking_bed_assignments (
      booking_id, bed_id, guest_gender, assigned_by,
      actual_check_in_at, actual_check_out_at
    )
    select p_booking_id, item->>'bed_id', item->>'guest_gender', auth.uid(),
      case when v_status = 'checked_in' and v_old.status <> 'checked_in' then now()
        else v_old.actual_check_in_at end,
      case when v_status = 'checked_out' then now() else null end
    from jsonb_array_elements(p_booking->'bed_assignments') as assignments(item);
  elsif v_status = 'checked_in' and v_old.status <> 'checked_in' then
    update public.booking_bed_assignments set actual_check_in_at = coalesce(actual_check_in_at, now())
    where booking_id = p_booking_id and released_at is null;
  elsif v_status = 'checked_out' then
    update public.booking_bed_assignments set actual_check_out_at = coalesce(actual_check_out_at, now()), released_at = now(), released_by = auth.uid()
    where booking_id = p_booking_id and released_at is null;
  elsif v_status in ('cancelled','no_show') then
    update public.booking_bed_assignments set released_at = now(), released_by = auth.uid()
    where booking_id = p_booking_id and released_at is null;
  end if;
  perform set_config('app.booking_change_reason', '', true);
  return v_booking;
end;
$$;
revoke all on function public.update_staff_booking(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.update_staff_bed_booking(uuid,jsonb) from public, anon;
grant execute on function public.update_staff_bed_booking(uuid,jsonb) to authenticated;
