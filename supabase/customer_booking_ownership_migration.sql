-- Customer-visible booking history. Existing rows are intentionally not linked
-- by email; verified account ownership must be assigned explicitly.

alter table public.bookings
  add column if not exists customer_user_id uuid
    references auth.users(id) on delete set null;

create index if not exists bookings_customer_user_created_idx
  on public.bookings (customer_user_id, created_at desc)
  where customer_user_id is not null;

drop policy if exists "Customers read own bookings" on public.bookings;
create policy "Customers read own bookings"
  on public.bookings for select to authenticated
  using (
    customer_user_id = (select auth.uid())
    and public.has_workspace_role(array['customer'])
  );

create table if not exists public.booking_customer_link_audit (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  previous_customer_user_id uuid references auth.users(id) on delete set null,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  reason text not null check (length(trim(reason)) >= 8),
  created_at timestamptz not null default now()
);
create index if not exists booking_customer_link_audit_booking_idx
  on public.booking_customer_link_audit (booking_id, created_at desc);

alter table public.booking_customer_link_audit enable row level security;
revoke all on public.booking_customer_link_audit from public, anon, authenticated;
grant select on public.booking_customer_link_audit to authenticated;
drop policy if exists "Managers read booking customer link audit"
  on public.booking_customer_link_audit;
create policy "Managers read booking customer link audit"
  on public.booking_customer_link_audit for select to authenticated
  using (public.is_workspace_manager());

create or replace function public.link_booking_to_customer(
  p_booking_id uuid,
  p_customer_user_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous_customer_user_id uuid;
begin
  if not public.is_workspace_manager() then
    raise exception 'Manager access required' using errcode = '42501';
  end if;
  if p_booking_id is null or p_customer_user_id is null
    or p_reason is null or length(trim(p_reason)) < 8 then
    raise exception 'Booking, customer, and a reason of at least 8 characters are required'
      using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.workspace_roles wr
    where wr.user_id = p_customer_user_id and wr.role = 'customer'
  ) then
    raise exception 'The target account must have the customer role'
      using errcode = '22023';
  end if;

  select b.customer_user_id into v_previous_customer_user_id
  from public.bookings b
  where b.id = p_booking_id
  for update;
  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  update public.bookings
  set customer_user_id = p_customer_user_id
  where id = p_booking_id;

  insert into public.booking_customer_link_audit (
    booking_id, previous_customer_user_id, customer_user_id, actor_id, reason
  ) values (
    p_booking_id, v_previous_customer_user_id, p_customer_user_id, auth.uid(), trim(p_reason)
  );
end;
$$;
revoke all on function public.link_booking_to_customer(uuid, uuid, text)
  from public, anon;
grant execute on function public.link_booking_to_customer(uuid, uuid, text)
  to authenticated;
