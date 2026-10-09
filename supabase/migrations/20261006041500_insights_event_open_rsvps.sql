-- Per-event open RSVP / check-in counts so the insights cards stay correct
-- when a specific event is selected (not the org-wide totals).

create or replace function public.get_org_attendance_insights(
  p_org_id bigint default null,
  p_event_id bigint default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_org_id is null then
    if not public.is_super_admin() then
      raise exception 'Not authorized';
    end if;
  elsif not public.can_view_org_insights(p_org_id) then
    raise exception 'Not authorized';
  end if;

  with org_events as (
    select e.id, e.start_date, e.location_str, e.tags, e.org_id, o.name as org_name, e.type, e.title
    from public.events e
    join public.orgs o on o.uuid = e.org_id
    where coalesce(e.deleted, false) is not true
      and coalesce(e.type, '') is distinct from 'forum'
      and o.name is distinct from 'super_org'
      and (p_org_id is null or e.org_id = p_org_id)
  ),
  scoped_events as (
    select *
    from org_events
    where p_event_id is null or id = p_event_id
  ),
  logs as (
    select
      el.id,
      coalesce(el.attended, false) as attended,
      coalesce(el.updated, el.created_at) as occurred_at,
      el.user_id,
      se.start_date,
      se.location_str,
      se.tags,
      se.org_id,
      se.org_name,
      u.major,
      u.expected_grad
    from public.events_log el
    join scoped_events se on se.id = el.event_id
    left join public.users u on u.uuid = el.user_id
  ),
  event_counts as (
    select
      el.event_id,
      count(*) filter (where not coalesce(el.attended, false)) as open_rsvps,
      count(*) filter (where coalesce(el.attended, false)) as checkins,
      count(distinct el.user_id) filter (where coalesce(el.attended, false)) as unique_attendees
    from public.events_log el
    join org_events oe on oe.id = el.event_id
    group by el.event_id
  ),
  daily as (
    select
      (occurred_at at time zone 'America/Los_Angeles')::date as day,
      count(*) filter (where attended) as attended,
      count(*) filter (where not attended) as rsvp
    from logs
    group by 1
    order by 1
  ),
  tag_slices as (
    select coalesce(nullif(trim(tag), ''), 'Untagged') as label, count(*)::bigint as value
    from logs
    left join lateral unnest(
      case
        when tags is null or cardinality(tags) = 0 then array['Untagged']::text[]
        else tags
      end
    ) as tag on true
    where attended
    group by 1
    order by value desc, label
  ),
  venues as (
    select coalesce(nullif(trim(location_str), ''), 'Unknown') as label, count(*)::bigint as value
    from logs
    where attended
    group by 1
    order by value desc, label
  ),
  time_of_day as (
    select
      case
        when extract(hour from coalesce(start_date, occurred_at) at time zone 'America/Los_Angeles') < 12 then 'Morning'
        when extract(hour from coalesce(start_date, occurred_at) at time zone 'America/Los_Angeles') < 17 then 'Afternoon'
        when extract(hour from coalesce(start_date, occurred_at) at time zone 'America/Los_Angeles') < 21 then 'Evening'
        else 'Night'
      end as label,
      count(*)::bigint as value
    from logs
    where attended
    group by 1
    order by value desc, label
  ),
  org_slices as (
    select org_name as label, count(*)::bigint as value
    from logs
    where attended
    group by 1
    order by value desc, label
  ),
  majors as (
    select coalesce(nullif(trim(major), ''), 'Unknown') as label, count(distinct user_id)::bigint as value
    from logs
    where attended
    group by 1
    order by value desc, label
  ),
  years as (
    select coalesce(nullif(trim(expected_grad), ''), 'Unknown') as label, count(distinct user_id)::bigint as value
    from logs
    where attended
    group by 1
    order by value desc, label
  ),
  upcoming as (
    select
      count(*)::bigint as cnt,
      min(start_date) as next_start
    from scoped_events
    where start_date > now()
  )
  select jsonb_build_object(
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'attended', attended, 'rsvp', rsvp) order by day) from daily), '[]'::jsonb),
    'tags', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'value', value)) from tag_slices), '[]'::jsonb),
    'venues', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'value', value)) from venues), '[]'::jsonb),
    'timeOfDay', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'value', value)) from time_of_day), '[]'::jsonb),
    'orgs', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'value', value)) from org_slices), '[]'::jsonb),
    'majors', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'value', value)) from majors), '[]'::jsonb),
    'years', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'value', value)) from years), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', oe.id::text,
          'title', oe.title,
          'startDate', oe.start_date,
          'openRsvps', coalesce(ec.open_rsvps, 0),
          'checkins', coalesce(ec.checkins, 0),
          'uniqueAttendees', coalesce(ec.unique_attendees, 0)
        )
        order by oe.start_date desc nulls last
      )
      from org_events oe
      left join event_counts ec on ec.event_id = oe.id
    ), '[]'::jsonb),
    'uniqueAttendees', (select count(distinct user_id) from logs where attended),
    'totalCheckins', (select count(*) from logs where attended),
    'totalRsvps', (select count(*) from logs where not attended),
    'attendedLast30', (
      select count(*) from logs
      where attended and occurred_at >= now() - interval '30 days'
    ),
    'attendedPrev30', (
      select count(*) from logs
      where attended
        and occurred_at >= now() - interval '60 days'
        and occurred_at < now() - interval '30 days'
    ),
    'upcomingEvents', (select cnt from upcoming),
    'nextEventStart', (select next_start from upcoming)
  )
  into result;

  return result;
end;
$$;

revoke all on function public.get_org_attendance_insights(bigint, bigint) from public, anon;
grant execute on function public.get_org_attendance_insights(bigint, bigint) to authenticated;

notify pgrst, 'reload schema';
