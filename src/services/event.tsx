import supabase from "@server/supabase";
import { EventSlot, EventSlotForm, formdata } from "@lib/constants";
import { logAttendance } from "./user";
import {
  deriveAttendanceCap,
  deriveEventRange,
  shiftSlots,
  validateEventSlots,
} from "./eventSlotUtils";

export {
  deriveAttendanceCap,
  deriveEventRange,
  shiftSlots,
  validateEventSlots,
} from "./eventSlotUtils";

const EVENT_SELECT =
  "id,content,created_at,end_date,location_str,start_date,tags,title,attendance,poster,rsvp,org_id, orgs!inner(name, pfp_str), attendance_cap, track_attendance, type, password, manual_attendance";

type SlotStatsRow = {
  slot_id: number;
  event_id: number;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  rsvp_count: number;
  attended_count: number;
};

async function enrichEventsWithSlotStats<T extends { id: number | string }>(events: T[]) {
  if (!events.length) return events.map((event) => ({ ...event, slots: [] as EventSlot[] }));

  const eventIds = events.map((event) => Number(event.id));
  const { data: stats, error } = await supabase
    .from("event_slot_stats")
    .select("slot_id, event_id, starts_at, ends_at, capacity, rsvp_count, attended_count")
    .in("event_id", eventIds)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Error fetching event slot stats:", error.message);
  }

  const slotsByEvent = new Map<number, EventSlot[]>();
  for (const row of (stats ?? []) as SlotStatsRow[]) {
    const list = slotsByEvent.get(row.event_id) ?? [];
    list.push({
      id: String(row.slot_id),
      event_id: String(row.event_id),
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      capacity: row.capacity,
      rsvp_count: Number(row.rsvp_count ?? 0),
      attended_count: Number(row.attended_count ?? 0),
    });
    slotsByEvent.set(row.event_id, list);
  }

  return events.map((event) => ({
    ...event,
    slots: slotsByEvent.get(Number(event.id)) ?? [],
  }));
}

async function replaceEventSlots(eventId: string, slots: EventSlotForm[]) {
  const validSlots = slots.filter((slot) => slot.starts_at && slot.ends_at);
  if (!validSlots.length) return null;

  const { error: deleteError } = await supabase.from("event_slots").delete().eq("event_id", eventId);
  if (deleteError) return deleteError;

  const { error: insertError } = await supabase.from("event_slots").insert(
    validSlots.map((slot) => ({
      event_id: Number(eventId),
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      capacity:
        slot.capacity != null && slot.capacity !== ("" as unknown as number)
          ? Number(slot.capacity)
          : null,
    })),
  );
  return insertError;
}

async function upsertEventSlots(eventId: string, slots: EventSlotForm[]) {
  const validSlots = slots.filter((slot) => slot.starts_at && slot.ends_at);
  if (!validSlots.length) return null;

  const { data: reservedSlots, error: reservedError } = await supabase
    .from("events_log")
    .select("event_slot_id")
    .eq("event_id", eventId)
    .not("event_slot_id", "is", null);
  if (reservedError) return reservedError;

  const protectedIds = new Set(
    (reservedSlots ?? [])
      .map((row) => row.event_slot_id)
      .filter((slotId): slotId is number => slotId != null),
  );
  const keepIds = new Set(
    validSlots
      .map((slot) => (slot.id ? Number(slot.id) : null))
      .filter((slotId): slotId is number => slotId != null),
  );

  const { data: currentSlots, error: currentError } = await supabase
    .from("event_slots")
    .select("id")
    .eq("event_id", eventId);
  if (currentError) return currentError;

  for (const slot of currentSlots ?? []) {
    if (!keepIds.has(slot.id) && !protectedIds.has(slot.id)) {
      const { error } = await supabase.from("event_slots").delete().eq("id", slot.id);
      if (error) return error;
    }
  }

  for (const slot of validSlots) {
    const payload = {
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      capacity:
        slot.capacity != null && slot.capacity !== ("" as unknown as number)
          ? Number(slot.capacity)
          : null,
    };
    if (slot.id) {
      const { error } = await supabase.from("event_slots").update(payload).eq("id", slot.id);
      if (error) return error;
    } else {
      const { error } = await supabase.from("event_slots").insert({
        event_id: Number(eventId),
        ...payload,
      });
      if (error) return error;
    }
  }

  return null;
}

function generateRecurringDates(
  startDateStr: string,
  recurrenceEndStr: string,
  rate: "daily" | "weekly" | "biweekly" | "monthly"
): string[] {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  const endDate = new Date(recurrenceEndStr + "T23:59:59");
  if (endDate < start) return [startDateStr];

  const current = new Date(start);

  while (current <= endDate) {
    dates.push(current.toISOString().slice(0, 16));
    switch (rate) {
      case "daily":
        current.setDate(current.getDate() + 1);
        break;
      case "weekly":
        current.setDate(current.getDate() + 7);
        break;
      case "biweekly":
        current.setDate(current.getDate() + 14);
        break;
      case "monthly":
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return dates;
}

const EVENT_IMAGES_BUCKET = "event.images";

/** Extract storage path from a Supabase public URL for event.images bucket, or null if not from this bucket. */
function getEventImageStoragePath(posterUrl: string): string | null {
  if (!posterUrl || typeof posterUrl !== "string") return null;
  const prefix = `/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/`;
  const i = posterUrl.indexOf(prefix);
  if (i === -1) return null;
  return posterUrl.slice(i + prefix.length);
}

export const fetchEventByOrg = async (uid: string, includeAllEvents: boolean = false) => {
  if (includeAllEvents) {
    const { data, error } = await supabase.from("events").select(EVENT_SELECT).eq("deleted", false);
    if (error) return { data, error };
    const enriched = await enrichEventsWithSlotStats(data ?? []);
    return { data: enriched, error: null };
  }
  console.log("FETCH USER ORGS");
  const { data: orgs, error } = await supabase
    .from("user_org_roles")
    .select("org_uuid")
    .eq("user_uuid", uid);
  if (error) return { data: null, error };
  const { data, error: eventsError } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .in(
      "org_id",
      orgs.map((org) => org.org_uuid),
    )
    .eq("deleted", false);
  if (eventsError) return { data: null, error: eventsError };
  const enriched = await enrichEventsWithSlotStats(data ?? []);
  return { data: enriched, error: null };
};

export const createEvent = async (formData: formdata, activeOrgName: string) => {
  const { data: org_name } = await supabase
    .from("orgs")
    .select("uuid")
    .eq("name", activeOrgName);
  if (!org_name || org_name.length === 0) return { message: "No org found" };

  const eventType = formData.type ?? "external";
  const isInternal = eventType === "internal";
  const isForum = eventType === "forum";
  const recurringRate = isForum ? "none" : formData.recurring_rate ?? "none";
  const recurrenceEnd = formData.recurrence_end_date ?? "";

  if (!isForum) {
    const slotError = validateEventSlots(formData.slots);
    if (slotError) return { message: slotError };
  }

  const buildEventPayload = (slots: EventSlotForm[]) => {
    const slotRange = deriveEventRange(slots);
    const attendanceCap = deriveAttendanceCap(slots);

    return {
      title: formData.title,
      password: formData.password,
      start_date: isForum ? (null as unknown as string) : (slotRange?.start_date ?? null),
      end_date: isForum ? (null as unknown as string) : (slotRange?.end_date ?? null),
      location: isForum ? [] : formData.location,
      location_str: isForum ? "" : formData.location_str,
      content: formData.content,
      tags: isInternal || isForum ? [] : formData.tags,
      org_id: org_name[0].uuid,
      poster: isInternal ? "" : formData.poster,
      attendance_cap: isInternal || isForum ? null : attendanceCap,
      track_attendance: isInternal || isForum ? false : formData.track_attendance ?? false,
      type: eventType,
      manual_attendance: isForum
        ? null
        : !(formData.track_attendance ?? false) &&
            formData.manual_attendance !== undefined &&
            formData.manual_attendance !== ""
          ? Number(formData.manual_attendance)
          : null,
    };
  };

  const syncSlotsForEvent = async (eventId: string, slots: EventSlotForm[]) => {
    return replaceEventSlots(eventId, slots);
  };

  const templateSlots = formData.slots ?? [];

  if (recurringRate !== "none" && recurrenceEnd && recurrenceEnd.trim() !== "") {
    const firstSlot = templateSlots[0];
    const startDates = generateRecurringDates(
      firstSlot.starts_at,
      recurrenceEnd,
      recurringRate as "daily" | "weekly" | "biweekly" | "monthly",
    );
    const templateStartMs = new Date(firstSlot.starts_at).getTime();

    if (startDates.length === 0) return { message: "No occurrences in date range" };
    if (startDates.length > 100) {
      return { message: "Too many occurrences (max 100). Please shorten the date range." };
    }

    console.log("----------INSERT RECURRING EVENTS-----------", startDates.length);
    for (const occurrenceStart of startDates) {
      const offsetMs = new Date(occurrenceStart).getTime() - templateStartMs;
      const occurrenceSlots = shiftSlots(templateSlots, offsetMs);
      const { data: insertedEvent, error } = await supabase
        .from("events")
        .insert([buildEventPayload(occurrenceSlots)])
        .select("id")
        .single();
      if (error) return error;
      if (insertedEvent?.id) {
        const slotError = await syncSlotsForEvent(String(insertedEvent.id), occurrenceSlots);
        if (slotError) return slotError;
      }
    }
    return null;
  }

  console.log("----------INSERT NEW EVENT-----------");
  const { data: insertedEvent, error } = await supabase
    .from("events")
    .insert([buildEventPayload(templateSlots)])
    .select("id")
    .single();
  if (error) return error;
  if (insertedEvent?.id) {
    const slotError = await syncSlotsForEvent(String(insertedEvent.id), templateSlots);
    if (slotError) return slotError;
  }
  return null;
};

export const deleteEvent = async (id: string) => {
  console.log("-------------DELETE EVENT-------------");

  const { data: eventRow } = await supabase.from("events").select("poster").eq("id", id).single();
  const poster = (eventRow as { poster?: string } | null)?.poster;
  const storagePath = getEventImageStoragePath(poster ?? "");
  if (storagePath) {
    await supabase.storage.from(EVENT_IMAGES_BUCKET).remove([storagePath]);
  }

  const { error } = await supabase.from("events").update({ deleted: true }).eq("id", id);
  return error;
};

export const updateEvent = async (eventId: string, formData: formdata) => {
  const eventType = formData.type ?? "external";
  const isInternal = eventType === "internal";
  const isForum = eventType === "forum";

  if (!isForum) {
    const slotError = validateEventSlots(formData.slots);
    if (slotError) return { message: slotError };
  }

  const slots = formData.slots ?? [];
  const slotRange = deriveEventRange(slots);
  const attendanceCap = deriveAttendanceCap(slots);

  const { error } = await supabase
    .from("events")
    .update({
      title: formData.title,
      password: formData.password,
      start_date: isForum ? (null as unknown as string) : (slotRange?.start_date ?? null),
      end_date: isForum ? (null as unknown as string) : (slotRange?.end_date ?? null),
      location: isForum ? [] : formData.location,
      location_str: isForum ? "" : formData.location_str,
      content: formData.content,
      tags: isInternal || isForum ? [] : formData.tags,
      poster: isInternal ? "" : formData.poster,
      attendance_cap: isInternal || isForum ? null : attendanceCap,
      track_attendance: isInternal || isForum ? false : formData.track_attendance ?? false,
      type: eventType,
      manual_attendance: isForum
        ? null
        : !(formData.track_attendance ?? false) &&
            formData.manual_attendance !== undefined &&
            formData.manual_attendance !== ""
          ? Number(formData.manual_attendance)
          : null,
    })
    .eq("id", eventId);
  if (error) return error;

  if (!isForum && slots.length > 0) {
    return upsertEventSlots(eventId, slots);
  }
  return null;
};

export const queryEventsBySearchAndFilters = async (
  keyword: string,
  tagFilters: string[],
  orgFilters: string[],
  typeFilters: string[],
  sortMethod: string,
  userId: string | undefined,
  options?: { internalFilter?: boolean; isSuperOrg?: boolean },
) => {
  const { internalFilter = false, isSuperOrg = false } = options ?? {};
  let query = supabase.from("events").select(EVENT_SELECT).ilike("title", `%${keyword}%`).eq("deleted", false);

  if (internalFilter) query = query.eq("type", "internal");

  if (tagFilters.length > 0) query = query.overlaps("tags", tagFilters);

  if (orgFilters.length > 0) {
    query = query.in("orgs.name", orgFilters);
  }
  if (typeFilters.length > 0) {
    query = query.in("type", typeFilters);
  }

  if (sortMethod === "Event Name (A-Z)") query = query.order("title", { ascending: true });
  else if (sortMethod == "Most Recent") query = query.order("start_date", { ascending: false });
  else query = query.order("start_date", { ascending: false });

  const { data, error } = await query;

  // Filter internal events: only show to users with org membership matching event's org_id
  let filteredEvents = data ?? [];

  if (isSuperOrg) {
    const enriched = await enrichEventsWithSlotStats(filteredEvents);
    return { events: enriched, error };
  }

  if (filteredEvents.length > 0) {
    const internalEvents = filteredEvents.filter((e: { type?: string }) => e.type === "internal");
    if (internalEvents.length > 0 && userId) {
      const { data: userOrgs } = await supabase
        .from("user_org_roles")
        .select("org_uuid")
        .eq("user_uuid", userId);
      const userOrgIds = new Set((userOrgs ?? []).map((r: { org_uuid: string }) => r.org_uuid));
      filteredEvents = filteredEvents.filter((e: { type?: string; org_id?: string }) =>
        e.type !== "internal" || (e.org_id && userOrgIds.has(e.org_id))
      );
    } else if (internalEvents.length > 0 && !userId) {
      filteredEvents = filteredEvents.filter((e: { type?: string }) => e.type !== "internal");
    }
  }

  const enriched = await enrichEventsWithSlotStats(filteredEvents);
  return { events: enriched, error };
};

export const queryPeopleBySearchAndFilters = async (
  keyword: string,
  tagFilters: string[],
  orgFilters: string[],
  sortMethod: string
) => {
  let query = supabase
    .from("users")
    .select(
      "uuid,email,created_at,points,resume_link,resume_storage_path,expected_grad,major,first_name,last_name",
    )
    .eq("resume_visible", true);

  if (keyword.trim()) {
    query = query.or(
      `first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%,major.ilike.%${keyword}%`,
    );
  }
  if (tagFilters.length > 0) query = query.in("expected_grad", tagFilters);

  if (orgFilters.length > 0) {
    query = query.in("major", orgFilters);
  }

  if (sortMethod === "Events attended") query = query.order("points", { ascending: true });
  else if (sortMethod == "First Name (A-Z)")
    query = query.order("first_name", { ascending: false });
  else if (sortMethod == "Last Name (A-Z)") query = query.order("last_name", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  const People = (data ?? []).filter(
    (person) =>
      (person.resume_link && String(person.resume_link).trim()) ||
      (person.resume_storage_path && String(person.resume_storage_path).trim()),
  );
  return { People, error };
};

// for attended events list
export const verifyEventAttendance = async (
  eventId: string,
  userId: string,
  password: string,
  eventSlotId?: string | null,
) => {
  console.log("----------VERIFYING EVENT ATTENDANCE-----------");
  const error = await logAttendance(eventId, userId, password, eventSlotId);
  // check password, update events_log, update user points/attended list

  if (error) {
    console.log("Attendance verification failed:", error);
  } else {
    console.log("Attendance successfully logged");
  }

  return { error };
};
