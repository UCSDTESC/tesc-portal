-- Day-of rules for rsvp_required events (Pacific calendar day a slot starts):
--   * Members who already RSVP'd can switch slots.
--   * Anyone can check in without an RSVP.
--   * New RSVPs and cancellations stay closed.
--
-- Switching and checking in move the member's open RSVP row onto the new slot
-- instead of deleting it, so registration answers (which cascade on delete)
-- stay attached and the old slot frees its seat.

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
  v_has_open_rsvp boolean;
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

  select exists (
    select 1 from public.events_log el
    where el.user_id = v_uid
      and el.event_id = p_event_id
      and el.attended = false
  ) into v_has_open_rsvp;

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

    if p_action = 'rsvp' and not v_has_open_rsvp and exists (
      select 1
      from public.event_slots es
      where es.id = p_event_slot_id
        and es.event_id = p_event_id
        and (es.starts_at at time zone 'America/Los_Angeles')::date = v_today
    ) then
      raise exception 'New RSVPs are closed on the day of this event. You can still check in at the event.';
    end if;

    -- A switch with no RSVP behind it would be a new RSVP in disguise.
    if p_action = 'switch' and not v_has_open_rsvp then
      raise exception 'You have no RSVP to switch';
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
  elsif v_has_open_rsvp then
    update public.events_log
    set event_slot_id = p_event_slot_id
    where user_id = v_uid
      and event_id = p_event_id
      and attended = false;
  else
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

  if exists (
    select 1 from public.events_log el
    where el.user_id = p_user_id
      and el.event_id = p_event_id
      and el.attended = true
  ) then
    return;
  end if;

  if v_slot_capacity is not null then
    select count(*) into v_seat_count
    from public.events_log el
    where el.event_slot_id = v_slot_id
      and el.user_id is distinct from p_user_id;

    if v_seat_count >= v_slot_capacity then
      raise exception 'This time slot is at capacity';
    end if;
  end if;

  update public.events_log
  set event_slot_id = v_slot_id,
      attended = true,
      points = points + 1
  where user_id = p_user_id
    and event_id = p_event_id
    and attended = false;

  if not found then
    insert into public.events_log (user_id, event_id, event_slot_id, points, attended)
    values (p_user_id, p_event_id, v_slot_id, 1, true);
  end if;

  update public.events e
  set attendance = e.attendance + 1,
      rsvp = (
        select count(*)::integer
        from public.events_log el
        join public.event_slots es on es.id = el.event_slot_id
        where es.event_id = p_event_id
          and el.attended = false
      )
  where e.id = p_event_id;

  update public.users u set points = u.points + 1 where u.uuid = p_user_id;
end;
$function$;

create or replace function public.validate_attendance_qr(
  p_user_id uuid,
  p_event_id bigint,
  p_token uuid,
  p_event_slot_id bigint
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_token uuid;
  v_slot_starts timestamptz;
  v_slot_ends timestamptz;
  v_slot_capacity bigint;
  v_seat_count bigint;
  v_now timestamptz := now();
  v_grace_before interval := interval '15 minutes';
  v_grace_after interval := interval '30 minutes';
  v_dependent_on_id int8;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'User not authenticated';
  end if;

  if p_user_id is distinct from v_uid then
    raise exception 'You can only check yourself in';
  end if;

  select attendance_token, dependent_on
  into v_token, v_dependent_on_id
  from public.events
  where id = p_event_id
    and deleted = false
    and track_attendance = true;

  if v_token is null or v_token <> p_token then
    raise exception 'Invalid attendance link';
  end if;

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

  select es.starts_at, es.ends_at, es.capacity
  into v_slot_starts, v_slot_ends, v_slot_capacity
  from public.event_slots es
  where es.id = p_event_slot_id
    and es.event_id = p_event_id
  for update;

  if v_slot_starts is null then
    raise exception 'Time slot not found';
  end if;

  if v_now < (v_slot_starts - v_grace_before) then
    raise exception 'Check-in is not open yet for this slot';
  end if;

  if v_now > (v_slot_ends + v_grace_after) then
    raise exception 'Check-in window has closed for this slot';
  end if;

  if exists (
    select 1 from public.events_log el
    where el.user_id = p_user_id
      and el.event_id = p_event_id
      and el.attended = true
  ) then
    return;
  end if;

  if v_slot_capacity is not null then
    select count(*) into v_seat_count
    from public.events_log el
    where el.event_slot_id = p_event_slot_id
      and el.user_id is distinct from p_user_id;

    if v_seat_count >= v_slot_capacity then
      raise exception 'This time slot is at capacity';
    end if;
  end if;

  update public.events_log
  set event_slot_id = p_event_slot_id,
      attended = true
  where user_id = p_user_id
    and event_id = p_event_id
    and attended = false;

  if not found then
    insert into public.events_log (user_id, event_id, event_slot_id, points, attended)
    values (p_user_id, p_event_id, p_event_slot_id, 1, true);
  end if;

  update public.events e
  set attendance = coalesce(e.attendance, 0) + 1,
      rsvp = (
        select count(*)::integer
        from public.events_log el
        join public.event_slots es on es.id = el.event_slot_id
        where es.event_id = p_event_id
          and el.attended = false
      )
  where e.id = p_event_id;
end;
$function$;
