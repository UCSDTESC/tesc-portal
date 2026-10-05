-- Slot fullness counts every open RSVP and every check-in.
-- The stats view runs as its owner so those totals are visible without
-- letting clients read other people's events_log rows.

alter view public.event_slot_stats set (security_invoker = off);

comment on view public.event_slot_stats is
  'Per-slot times, capacity, open RSVPs, and check-ins. Aggregates only; does not expose user ids.';

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
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select e.dependent_on into v_dependent_on_id
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

    -- Hold the slot row so two RSVPs cannot take the last seat.
    select es.capacity into v_slot_capacity
    from public.event_slots es
    where es.id = p_event_slot_id
    for update;

    if v_slot_capacity is not null then
      -- Checked-in rows keep their seat. The caller's open RSVP does not,
      -- because this action replaces it.
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

create or replace function public.validate_attendance(
  p_user_id uuid,
  p_event_id bigint,
  p_password text,
  p_event_slot_id bigint default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_upserted boolean := false;
  v_slot_id bigint;
  v_slot_capacity bigint;
  v_seat_count bigint;
  v_dependent_on_id int8;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'User not authenticated';
  end if;

  if not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.password = p_password
  ) then
    raise exception 'Incorrect attendance password';
  end if;

  select e.dependent_on into v_dependent_on_id
  from public.events e
  where e.id = p_event_id;

  if v_dependent_on_id is not null then
    if not exists (
      select 1 from public.events_log lg
      where lg.user_id = p_user_id
        and lg.event_id = v_dependent_on_id
        and lg.attended = true
    ) then
      raise exception 'Event pre-requisite not met';
    end if;
  end if;

  if p_event_slot_id is not null then
    v_slot_id := p_event_slot_id;
  else
    select es.id into v_slot_id
    from public.event_slots es
    where es.event_id = p_event_id
    order by es.starts_at asc
    limit 1;
    if v_slot_id is null then
      raise exception 'No event slot found for this event';
    end if;
  end if;

  if not exists (
    select 1 from public.event_slots es
    where es.id = v_slot_id and es.event_id = p_event_id
  ) then
    raise exception 'Invalid event slot for this event';
  end if;

  select es.capacity into v_slot_capacity
  from public.event_slots es
  where es.id = v_slot_id
  for update;

  if v_slot_capacity is not null then
    select count(*) into v_seat_count
    from public.events_log el
    where el.event_slot_id = v_slot_id
      and el.user_id is distinct from p_user_id;

    if v_seat_count >= v_slot_capacity then
      raise exception 'This time slot is at capacity';
    end if;
  end if;

  with upsert as (
    insert into public.events_log (user_id, event_id, event_slot_id, points, attended)
    values (p_user_id, p_event_id, v_slot_id, 1, true)
    on conflict (user_id, event_slot_id) where (event_slot_id is not null)
    do update set
      attended = true,
      points = case
        when public.events_log.attended is true then public.events_log.points
        else public.events_log.points + 1
      end
    where public.events_log.attended is distinct from true
    returning 1
  )
  select exists (select 1 from upsert) into v_upserted;

  if v_upserted then
    update public.events e set attendance = e.attendance + 1 where e.id = p_event_id;
    update public.users u set points = u.points + 1 where u.uuid = p_user_id;
  end if;
end;
$function$;
