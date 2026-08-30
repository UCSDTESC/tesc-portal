-- Integration test: multi-slot RSVP + attendance flow
-- Run against Supabase; cleans up test data on success or failure.

DO $$
DECLARE
  v_event_id bigint;
  v_slot1 bigint;
  v_slot2 bigint;
  v_slot3 bigint;
  v_user1 uuid := '90b9aa47-d14d-46c4-9233-e5335c6e1c45';
  v_user2 uuid := 'c19b9bed-cb9c-4de1-a748-194f14e08f75';
  v_user3 uuid := 'e9aee47a-4306-4bd4-b043-580ee2c48e7e';
  v_user4 uuid := 'b3fc59db-30bd-4ad0-b50a-3a283215ed83';
  v_org_id bigint := 42;
  v_count int;
  v_slot_id bigint;
  v_attended boolean;
BEGIN
  -- 1) Create event with three slots
  INSERT INTO public.events (
    title, content, tags, poster, org_id, track_attendance, password, type, rsvp, attendance,
    start_date, end_date, attendance_cap
  )
  VALUES (
    '__INTEGRATION_TEST_MULTI_SLOT__',
    'integration test',
    ARRAY['other']::text[],
    '',
    v_org_id,
    true,
    'integration-test-pw',
    'external',
    0,
    0,
    now() + interval '2 days',
    now() + interval '2 days 6 hours',
    5
  )
  RETURNING id INTO v_event_id;

  -- Remove auto-created default slot from trigger so we control test slots exactly
  DELETE FROM public.event_slots WHERE event_id = v_event_id;

  INSERT INTO public.event_slots (event_id, starts_at, ends_at, capacity)
  VALUES (v_event_id, now() + interval '2 days', now() + interval '2 days 1 hour', 2)
  RETURNING id INTO v_slot1;

  INSERT INTO public.event_slots (event_id, starts_at, ends_at, capacity)
  VALUES (v_event_id, now() + interval '2 days 2 hours', now() + interval '2 days 3 hours', 2)
  RETURNING id INTO v_slot2;

  INSERT INTO public.event_slots (event_id, starts_at, ends_at, capacity)
  VALUES (v_event_id, now() + interval '2 days 4 hours', now() + interval '2 days 5 hours', 1)
  RETURNING id INTO v_slot3;

  IF (SELECT COUNT(*) FROM public.event_slots WHERE event_id = v_event_id) <> 3 THEN
    RAISE EXCEPTION 'FAIL: expected 3 slots, got %', (SELECT COUNT(*) FROM public.event_slots WHERE event_id = v_event_id);
  END IF;

  -- 2) User1 RSVPs slot1
  PERFORM set_config('request.jwt.claim.sub', v_user1::text, true);
  PERFORM public.manage_event_rsvp(v_event_id, v_slot1, 'rsvp');

  SELECT event_slot_id INTO v_slot_id
  FROM public.events_log
  WHERE user_id = v_user1 AND event_id = v_event_id AND attended = false;

  IF v_slot_id IS DISTINCT FROM v_slot1 THEN
    RAISE EXCEPTION 'FAIL: user1 should be on slot1, got %', v_slot_id;
  END IF;

  -- 3) User1 switches to slot2 (only one RSVP per event)
  PERFORM public.manage_event_rsvp(v_event_id, v_slot2, 'switch');

  SELECT COUNT(*) INTO v_count
  FROM public.events_log
  WHERE user_id = v_user1 AND event_id = v_event_id AND attended = false;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FAIL: user1 should have exactly 1 open RSVP, got %', v_count;
  END IF;

  SELECT event_slot_id INTO v_slot_id
  FROM public.events_log
  WHERE user_id = v_user1 AND event_id = v_event_id AND attended = false;

  IF v_slot_id IS DISTINCT FROM v_slot2 THEN
    RAISE EXCEPTION 'FAIL: user1 should have switched to slot2, got %', v_slot_id;
  END IF;

  SELECT rsvp_count::int INTO v_count
  FROM public.event_slot_stats
  WHERE slot_id = v_slot1;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: slot1 rsvp_count should be 0 after switch, got %', v_count;
  END IF;

  -- 4) User2 RSVPs slot1, user3 fills slot3 (capacity 1)
  PERFORM set_config('request.jwt.claim.sub', v_user2::text, true);
  PERFORM public.manage_event_rsvp(v_event_id, v_slot1, 'rsvp');

  PERFORM set_config('request.jwt.claim.sub', v_user3::text, true);
  PERFORM public.manage_event_rsvp(v_event_id, v_slot3, 'rsvp');

  BEGIN
    PERFORM set_config('request.jwt.claim.sub', v_user4::text, true);
    PERFORM public.manage_event_rsvp(v_event_id, v_slot3, 'rsvp');
    RAISE EXCEPTION 'FAIL: second RSVP to full slot3 should have failed';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  SELECT rsvp INTO v_count FROM public.events WHERE id = v_event_id;
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'FAIL: events.rsvp should be 3, got %', v_count;
  END IF;

  -- 5) User2 attends slot1 with event password
  PERFORM public.validate_attendance(v_user2, v_event_id, 'integration-test-pw', v_slot1);

  SELECT attended INTO v_attended
  FROM public.events_log
  WHERE user_id = v_user2 AND event_id = v_event_id;

  IF v_attended IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL: user2 attendance not recorded';
  END IF;

  -- 6) User1 cancels RSVP before attending
  PERFORM set_config('request.jwt.claim.sub', v_user1::text, true);
  PERFORM public.manage_event_rsvp(v_event_id, v_slot2, 'cancel');

  SELECT COUNT(*) INTO v_count
  FROM public.events_log
  WHERE user_id = v_user1 AND event_id = v_event_id AND attended = false;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: user1 cancel should remove open RSVP';
  END IF;

  -- Cleanup
  DELETE FROM public.events_log WHERE event_id = v_event_id;
  DELETE FROM public.event_slots WHERE event_id = v_event_id;
  DELETE FROM public.events WHERE id = v_event_id;

  RAISE NOTICE 'PASS: multi-slot create, RSVP, switch, capacity, attendance, cancel';
END $$;
