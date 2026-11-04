-- Workspace roles and access controls.
-- Safe to apply to existing data: this migration does not drop application rows.

create table if not exists public.workspace_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer'
    check (role in ('customer', 'staff', 'ceo')),
  is_manager boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_roles_manager_is_staff
    check (not is_manager or role = 'staff')
);

alter table public.workspace_roles enable row level security;
revoke all on public.workspace_roles from anon, authenticated;
grant select on public.workspace_roles to authenticated;

drop policy if exists "Users read own workspace role" on public.workspace_roles;
create policy "Users read own workspace role"
  on public.workspace_roles for select
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.get_workspace_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select wr.role from public.workspace_roles as wr where wr.user_id = auth.uid()),
    'customer'
  );
$$;

create or replace function public.is_workspace_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_roles as wr
    where wr.user_id = auth.uid()
      and wr.role = 'staff'
      and wr.is_manager
  );
$$;

create or replace function public.has_workspace_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_roles as wr
    where wr.user_id = auth.uid()
      and wr.role = any (allowed_roles)
  );
$$;

revoke all on function public.get_workspace_role() from public, anon;
revoke all on function public.is_workspace_manager() from public, anon;
revoke all on function public.has_workspace_role(text[]) from public, anon;
grant execute on function public.get_workspace_role() to authenticated;
grant execute on function public.is_workspace_manager() to anon, authenticated;
grant execute on function public.has_workspace_role(text[]) to anon, authenticated;

create or replace function public.get_ceo_booking_overview()
returns table (
  total_bookings bigint,
  pending_bookings bigint,
  confirmed_bookings bigint,
  cancelled_bookings bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_workspace_role(array['ceo']) then
    raise exception 'CEO workspace access required' using errcode = '42501';
  end if;

  return query
  select
    count(*),
    count(*) filter (where b.status = 'pending'),
    count(*) filter (where b.status = 'confirmed'),
    count(*) filter (where b.status = 'cancelled')
  from public.bookings as b;
end;
$$;

revoke all on function public.get_ceo_booking_overview() from public, anon;
grant execute on function public.get_ceo_booking_overview() to authenticated;

create or replace function public.assign_default_customer_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists assign_default_customer_role on auth.users;
create trigger assign_default_customer_role
  after insert on auth.users
  for each row execute function public.assign_default_customer_role();
revoke all on function public.assign_default_customer_role() from public, anon, authenticated;

-- Existing accounts are customers until an authorized operator assigns roles.
insert into public.workspace_roles (user_id, role)
select id, 'customer' from auth.users
on conflict (user_id) do nothing;

-- Replace existing table policies so authenticated customers cannot inherit
-- broad "authenticated" access from older setup scripts.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'bookings', 'chat_messages', 'settings', 'content', 'reviews', 'rooms',
        'payment_history', 'admin_responses', 'audit_log', 'room_availability',
        'room_blocks'
      ])
  loop
    execute format(
      'drop policy %I on %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  end loop;
end;
$$;

-- Prevent legacy, SECURITY DEFINER summary views from exposing booking totals
-- that are not verified receipts. These can be replaced by verified reports later.
do $$
begin
  if to_regclass('public.bookings_summary') is not null then
    execute 'revoke all on public.bookings_summary from public, anon, authenticated';
  end if;
  if to_regclass('public.revenue_by_month') is not null then
    execute 'revoke all on public.revenue_by_month from public, anon, authenticated';
  end if;
  if to_regclass('public.guest_statistics') is not null then
    execute 'revoke all on public.guest_statistics from public, anon, authenticated';
  end if;
end;
$$;

-- Bookings are no longer publicly insertable. Staff can manage records; CEO
-- receives only the aggregate overview function defined above.
alter table public.bookings enable row level security;
create policy "Staff manage bookings"
  on public.bookings for all
  using (public.has_workspace_role(array['staff']))
  with check (public.has_workspace_role(array['staff']));

alter table public.chat_messages enable row level security;
create policy "Staff manage chat messages"
  on public.chat_messages for all
  using (public.has_workspace_role(array['staff']))
  with check (public.has_workspace_role(array['staff']));
create policy "Public send customer chat messages"
  on public.chat_messages for insert
  with check (sender = 'client');

alter table public.settings enable row level security;
create policy "Public read settings"
  on public.settings for select
  using (true);
create policy "Managers manage settings"
  on public.settings for all
  using (public.is_workspace_manager())
  with check (public.is_workspace_manager());

alter table public.content enable row level security;
create policy "Public read content"
  on public.content for select
  using (true);
create policy "Managers manage content"
  on public.content for all
  using (public.is_workspace_manager())
  with check (public.is_workspace_manager());

alter table public.reviews enable row level security;
create policy "Public read approved reviews"
  on public.reviews for select
  using (approved);
create policy "Staff read all reviews"
  on public.reviews for select
  using (public.has_workspace_role(array['staff']));
create policy "Public submit unapproved reviews"
  on public.reviews for insert
  with check (not approved);
create policy "Staff manage reviews"
  on public.reviews for update
  using (public.has_workspace_role(array['staff']))
  with check (public.has_workspace_role(array['staff']));
create policy "Staff delete reviews"
  on public.reviews for delete
  using (public.has_workspace_role(array['staff']));

-- Room pricing is public to read and manager-only to change.
do $$
begin
  if to_regclass('public.rooms') is not null then
    execute 'alter table public.rooms enable row level security';
    execute 'create policy "Public read rooms" on public.rooms for select using (true)';
    execute 'create policy "Managers manage rooms" on public.rooms for all using (public.is_workspace_manager()) with check (public.is_workspace_manager())';
  end if;

  if to_regclass('public.payment_history') is not null then
    execute 'alter table public.payment_history enable row level security';
    execute 'create policy "Staff read payment history" on public.payment_history for select using (public.has_workspace_role(array[''staff'']))';
    execute 'create policy "Staff manage payment history" on public.payment_history for insert with check (public.has_workspace_role(array[''staff'']))';
    execute 'create policy "Staff update payment history" on public.payment_history for update using (public.has_workspace_role(array[''staff''])) with check (public.has_workspace_role(array[''staff'']))';
  end if;

  if to_regclass('public.admin_responses') is not null then
    execute 'alter table public.admin_responses enable row level security';
    execute 'create policy "Staff read admin responses" on public.admin_responses for select using (public.has_workspace_role(array[''staff'']))';
    execute 'create policy "Staff create admin responses" on public.admin_responses for insert with check (public.has_workspace_role(array[''staff'']))';
  end if;

  if to_regclass('public.audit_log') is not null then
    execute 'alter table public.audit_log enable row level security';
    execute 'create policy "Managers read audit log" on public.audit_log for select using (public.is_workspace_manager())';
  end if;

  if to_regclass('public.room_availability') is not null then
    execute 'alter table public.room_availability enable row level security';
    execute 'create policy "Staff manage room availability" on public.room_availability for all using (public.has_workspace_role(array[''staff''])) with check (public.has_workspace_role(array[''staff'']))';
  end if;
end;
$$;

-- The current staff workspace already uses this table. Create it only when
-- absent, preserving any existing blocks and adding no booking records.
create table if not exists public.room_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  from_date date not null,
  to_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint room_blocks_valid_dates check (to_date >= from_date)
);

alter table public.room_blocks enable row level security;
create policy "Staff manage room blocks"
  on public.room_blocks for all
  using (public.has_workspace_role(array['staff']))
  with check (public.has_workspace_role(array['staff']));
