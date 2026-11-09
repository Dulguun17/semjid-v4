-- Correct the public bed-availability aggregate. Apply to the isolated test project.
-- The room-level values are constant for each room and must be grouped with its bed aggregate.
begin;
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
    group by room_allocation.allocation_required, room_gender.gender_conflict, room_gender.genders
  ) bed_rows
  where u.active;
  return v_result;
end;
$$;
revoke all on function public.get_public_bed_availability(date,date,text) from public, anon, authenticated;
grant execute on function public.get_public_bed_availability(date,date,text) to service_role;

commit;
