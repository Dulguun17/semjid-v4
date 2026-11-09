create table if not exists public.booking_feedback (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  room_id text,
  check_in date not null,
  check_out date not null,
  room_rating integer not null check (room_rating between 1 and 5),
  service_rating integer not null check (service_rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  submitted_at timestamptz not null default now(),
  constraint booking_feedback_one_per_booking unique (booking_id),
  constraint booking_feedback_valid_stay check (check_out > check_in)
);

create index if not exists booking_feedback_customer_submitted_idx
  on public.booking_feedback (customer_user_id, submitted_at desc);

alter table public.booking_feedback enable row level security;
revoke all on public.booking_feedback from public, anon, authenticated;
grant select on public.booking_feedback to authenticated;

drop policy if exists "Customers read own booking feedback" on public.booking_feedback;
create policy "Customers read own booking feedback"
  on public.booking_feedback for select to authenticated
  using (
    customer_user_id = (select auth.uid())
    and public.has_workspace_role(array['customer'])
  );

create or replace function public.submit_customer_booking_feedback(
  p_booking_id uuid,
  p_room_rating integer,
  p_service_rating integer,
  p_comment text default null
)
returns public.booking_feedback
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_feedback public.booking_feedback%rowtype;
  v_comment text := nullif(pg_catalog.btrim(p_comment), '');
begin
  if v_customer_user_id is null
    or not public.has_workspace_role(array['customer']) then
    raise exception 'Customer access required' using errcode = '42501';
  end if;

  if p_booking_id is null
    or p_room_rating is null or p_room_rating not between 1 and 5
    or p_service_rating is null or p_service_rating not between 1 and 5
    or (v_comment is not null and pg_catalog.char_length(v_comment) > 2000) then
    raise exception 'Valid ratings and comment are required' using errcode = '22023';
  end if;

  select b.* into v_booking
  from public.bookings b
  where b.id = p_booking_id
    and b.customer_user_id = v_customer_user_id
    and b.status = 'checked_out'
  for update;
  if not found then
    raise exception 'This stay is not eligible for feedback' using errcode = '42501';
  end if;

  insert into public.booking_feedback (
    booking_id, customer_user_id, room_id, check_in, check_out,
    room_rating, service_rating, comment
  ) values (
    v_booking.id, v_customer_user_id, v_booking.room_id, v_booking.check_in, v_booking.check_out,
    p_room_rating, p_service_rating, v_comment
  )
  returning * into v_feedback;

  return v_feedback;
end;
$$;

revoke all on function public.submit_customer_booking_feedback(uuid, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.submit_customer_booking_feedback(uuid, integer, integer, text)
  to authenticated;
