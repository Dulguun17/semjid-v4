with checks as (
  select
    'feedback table exists with RLS enabled' as check_name,
    coalesce((
      select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'booking_feedback'
    ), false) as ok,
    jsonb_build_object(
      'table_exists', to_regclass('public.booking_feedback') is not null,
      'rls_enabled', coalesce((
        select c.relrowsecurity
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'booking_feedback'
      ), false)
    ) as details
  union all
  select
    'one feedback per booking and rating constraints exist',
    exists (
      select 1 from pg_constraint c
      where c.conrelid = to_regclass('public.booking_feedback')
        and c.conname = 'booking_feedback_one_per_booking'
        and c.contype = 'u'
    ) and (
      select count(*) = 3 from pg_constraint c
      where c.conrelid = to_regclass('public.booking_feedback')
        and c.contype = 'c'
        and c.conname in (
          'booking_feedback_room_rating_check',
          'booking_feedback_service_rating_check',
          'booking_feedback_valid_stay'
        )
    ),
    jsonb_build_object(
      'unique_booking_constraint', exists (
        select 1 from pg_constraint c
        where c.conrelid = to_regclass('public.booking_feedback')
          and c.conname = 'booking_feedback_one_per_booking'
          and c.contype = 'u'
      ),
      'required_checks', (
        select count(*) from pg_constraint c
        where c.conrelid = to_regclass('public.booking_feedback')
          and c.contype = 'c'
          and c.conname in (
            'booking_feedback_room_rating_check',
            'booking_feedback_service_rating_check',
            'booking_feedback_valid_stay'
          )
      )
    )
  union all
  select
    'only customers can select their own feedback',
    exists (
      select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = 'booking_feedback'
        and p.policyname = 'Customers read own booking feedback'
        and p.cmd = 'SELECT'
        and p.roles @> array['authenticated']::name[]
        and p.qual ilike '%customer_user_id%'
        and p.qual ilike '%auth.uid%'
        and p.qual ilike '%has_workspace_role%'
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object('policy', p.policyname, 'command', p.cmd, 'qual', p.qual))
      from pg_policies p
      where p.schemaname = 'public' and p.tablename = 'booking_feedback'
    ), '[]'::jsonb)
  union all
  select
    'feedback is not directly writable by signed-in or anonymous users',
    coalesce(
      has_table_privilege('authenticated', to_regclass('public.booking_feedback'), 'SELECT')
        and not coalesce(has_table_privilege('anon', to_regclass('public.booking_feedback'), 'SELECT'), false)
        and not coalesce(has_table_privilege('authenticated', to_regclass('public.booking_feedback'), 'INSERT'), false)
        and not coalesce(has_table_privilege('authenticated', to_regclass('public.booking_feedback'), 'UPDATE'), false)
        and not coalesce(has_table_privilege('authenticated', to_regclass('public.booking_feedback'), 'DELETE'), false),
      false
    ),
    jsonb_build_object(
      'authenticated_select', coalesce(has_table_privilege('authenticated', to_regclass('public.booking_feedback'), 'SELECT'), false),
      'anon_select', coalesce(has_table_privilege('anon', to_regclass('public.booking_feedback'), 'SELECT'), false),
      'authenticated_insert', coalesce(has_table_privilege('authenticated', to_regclass('public.booking_feedback'), 'INSERT'), false),
      'authenticated_update', coalesce(has_table_privilege('authenticated', to_regclass('public.booking_feedback'), 'UPDATE'), false),
      'authenticated_delete', coalesce(has_table_privilege('authenticated', to_regclass('public.booking_feedback'), 'DELETE'), false)
    )
  union all
  select
    'feedback RPC checks customer ownership and checked-out status',
    p.oid is not null
      and p.prosecdef
      and array_to_string(p.proconfig, ',') like '%search_path=%'
      and pg_get_functiondef(p.oid) ilike '%customer_user_id%'
      and pg_get_functiondef(p.oid) ilike '%checked_out%'
      and pg_get_functiondef(p.oid) ilike '%has_workspace_role%',
    jsonb_build_object(
      'exists', p.oid is not null,
      'security_definer', coalesce(p.prosecdef, false),
      'authenticated_execute', coalesce(has_function_privilege('authenticated', p.oid, 'EXECUTE'), false),
      'anon_execute', coalesce(has_function_privilege('anon', p.oid, 'EXECUTE'), false)
    )
  from (select to_regprocedure('public.submit_customer_booking_feedback(uuid,integer,integer,text)') as oid) f
  left join pg_proc p on p.oid = f.oid
)
select check_name, ok, details
from checks
order by check_name;
