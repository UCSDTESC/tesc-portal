-- Organizers can require an RSVP ahead of the event. On the Pacific calendar
-- day a slot starts, new RSVPs, slot switches, and cancellations are rejected.
-- Check-in for an existing RSVP stays on validate_attendance.

alter table public.events
  add column if not exists rsvp_required boolean not null default false;

create or replace function public.manage_event_rsvp(
  p_event_id bigint,
  p_event_slot_id bigint,
  p_action text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_slot_capacity bigint;
  v_seat_count bigint;
  v_dependent_on_id int8;
  v_rsvp_required boolean := false;
  v_today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select e.dependent_on, coalesce(e.rsvp_required, false)
  into v_dependent_on_id, v_rsvp_required
  from public.events e
  where e.id = p_event_id;

  if v_dependent_on_id is not null then
    if not exists (
      select 1 from public.events_log lg
      where lg.user_id = v_uid and lg.event_id = v_dependent_on_id
    ) then
      raise exception 'Event pre-requisite not met';
    end if;
  end if;

  if p_action not in ('rsvp', 'cancel', 'switch') then
    raise exception 'Invalid RSVP action';
  end if;

  if not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.deleted = false
  ) then
    raise exception 'Event not found';
  end if;

  if v_rsvp_required then
    if p_action = 'cancel' and exists (
      select 1
      from public.events_log el
      join public.event_slots es on es.id = el.event_slot_id
      where el.user_id = v_uid
        and el.event_id = p_event_id
        and el.attended = false
        and (es.starts_at at time zone 'America/Los_Angeles')::date = v_today
    ) then
      raise exception 'RSVP changes are closed on the day of this event';
    end if;

    if p_action in ('rsvp', 'switch') and exists (
      select 1
      from public.event_slots es
      where es.id = p_event_slot_id
        and es.event_id = p_event_id
        and (es.starts_at at time zone 'America/Los_Angeles')::date = v_today
    ) then
      raise exception 'RSVP changes are closed on the day of this event';
    end if;

    if p_action = 'switch' and exists (
      select 1
      from public.events_log el
      join public.event_slots es on es.id = el.event_slot_id
      where el.user_id = v_uid
        and el.event_id = p_event_id
        and el.attended = false
        and (es.starts_at at time zone 'America/Los_Angeles')::date = v_today
    ) then
      raise exception 'RSVP changes are closed on the day of this event';
    end if;
  end if;

  if p_action in ('rsvp', 'switch') then
    if not exists (
      select 1 from public.event_slots es
      where es.id = p_event_slot_id and es.event_id = p_event_id
    ) then
      raise exception 'Invalid event slot for this event';
    end if;

    if exists (
      select 1 from public.events_log el
      where el.user_id = v_uid
        and el.event_id = p_event_id
        and el.attended = true
    ) then
      raise exception 'Already checked in';
    end if;

    select es.capacity into v_slot_capacity
    from public.event_slots es
    where es.id = p_event_slot_id
    for update;

    if v_slot_capacity is not null then
      select count(*) into v_seat_count
      from public.events_log el
      where el.event_slot_id = p_event_slot_id
        and not (el.user_id = v_uid and el.attended = false);

      if v_seat_count >= v_slot_capacity then
        raise exception 'This time slot is at capacity';
      end if;
    end if;
  end if;

  if p_action = 'cancel' then
    delete from public.events_log
    where user_id = v_uid
      and event_id = p_event_id
      and attended = false;
  else
    delete from public.events_log
    where user_id = v_uid
      and event_id = p_event_id
      and attended = false;

    insert into public.events_log (user_id, event_id, event_slot_id, points, attended)
    values (v_uid, p_event_id, p_event_slot_id, 1, false);
  end if;

  update public.events e
  set rsvp = (
    select count(*)::integer
    from public.events_log el
    join public.event_slots es on es.id = el.event_slot_id
    where es.event_id = p_event_id
      and el.attended = false
  )
  where e.id = p_event_id;
end;
$function$;
