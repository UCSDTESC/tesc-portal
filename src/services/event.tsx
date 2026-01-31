import supabase from "@server/supabase";
import { DateGroup, formdata } from "@lib/constants";
import { User } from "@lib/UserContext";
import { logAttendance } from "./user";

function generateRecurringDates(
  startDateStr: string,
  recurrenceEndStr: string,
  rate: "daily" | "weekly" | "biweekly" | "monthly"
): string[] {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  // recurrence_end_date is YYYY-MM-DD; include occurrences that start on or before this date
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

function addDurationToDate(dateStr: string, durationMs: number): string {
  const d = new Date(dateStr);
  d.setTime(d.getTime() + durationMs);
  return d.toISOString().slice(0, 16);
}

/** Format datetime for datetime-local input (YYYY-MM-DDTHH:mm) */
function toDatetimeLocal(str: string): string {
  if (!str) return "";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

export const fetchEventSlots = async (
  eventId: string
): Promise<{ id: number; startDate: string; endDate: string }[]> => {
  const { data, error } = await supabase
    .from("event_slots")
    .select("id, starts_at, ends_at")
    .eq("event_id", eventId)
    .order("starts_at", { ascending: true });

  if (error) return [];
  return (data ?? []).map((slot: { id: number; starts_at: string; ends_at: string }) => ({
    id: slot.id,
    startDate: toDatetimeLocal(slot.starts_at),
    endDate: toDatetimeLocal(slot.ends_at),
  }));
};

export const fetchEventByOrg = async (uid: string) => {
  console.log("FETCH USER ORGS");
  const { data: orgs, error } = await supabase
    .from("user_org_roles")
    .select("org_uuid")
    .eq("user_uuid", uid);
  if (error) return { data: null, error };
  else {
    const { data, error } = await supabase
      .from("events")
      .select()
      .in(
        "org_id",
        orgs.map((org) => org.org_uuid)
      )
      .eq("deleted", false);
    return { data, error };
  }
};

export const createEvent = async (User: User, formData: formdata, Timeslots: DateGroup[]) => {
  const { data: org_name } = await supabase
    .from("user_org_roles")
    .select("org_uuid")
    .eq("user_uuid", User.id);

  if (!org_name) return { message: "No org found" };

  const isInternal = formData.internal ?? false;
  const recurringRate = formData.recurring_rate ?? "none";
  const recurrenceEnd = formData.recurrence_end_date ?? "";

  const buildEventPayload = (startDate: string, endDate: string) => ({
    title: formData.title,
    password: formData.password,
    start_date: startDate,
    end_date: endDate,
    location: formData.location,
    location_str: formData.location_str,
    content: formData.content,
    tags: isInternal ? [] : formData.tags,
    org_id: org_name[0].org_uuid,
    poster: isInternal ? "" : formData.poster,
    attendance_cap: isInternal
      ? null
      : formData.attendance_cap
        ? Number(formData.attendance_cap)
        : null,
    track_attendance: formData.track_attendance ?? false,
    internal: formData.internal ?? false,
    manual_attendance:
      !(formData.track_attendance ?? false) &&
      formData.manual_attendance !== undefined &&
      formData.manual_attendance !== ""
        ? Number(formData.manual_attendance)
        : null,
  });

  if (recurringRate !== "none" && recurrenceEnd && recurrenceEnd.trim() !== "") {
    const startDates = generateRecurringDates(
      formData.start_date,
      recurrenceEnd,
      recurringRate as "daily" | "weekly" | "biweekly" | "monthly"
    );
    const durationMs =
      new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime();

    const eventsToInsert = startDates.map((startDate) =>
      buildEventPayload(startDate, addDurationToDate(startDate, durationMs))
    );

    if (eventsToInsert.length === 0) return { message: "No occurrences in date range" };
    if (eventsToInsert.length > 100) {
      return { message: "Too many occurrences (max 100). Please shorten the date range." };
    }

    console.log("----------INSERT RECURRING EVENTS-----------", eventsToInsert.length);
    const { data: insertedRecurring, error } = await supabase
      .from("events")
      .insert(eventsToInsert)
      .select("id, start_date, end_date, attendance_cap");

    if (error) return error;

    // Insert one event_slot per recurring occurrence (starts_at/ends_at from event, capacity from attendance_cap)
    if (insertedRecurring) {
      for (const evt of insertedRecurring) {
        const { error: slotError } = await supabase.from("event_slots").insert({
          event_id: evt.id,
          starts_at: evt.start_date,
          ends_at: evt.end_date,
          capacity: evt.attendance_cap ?? null,
        });
        if (slotError) return slotError;
      }
    }
    return null;
  }

  const startDate = Timeslots.length > 0 ? Timeslots[0].startDate : formData.start_date;
  const endDate =
    Timeslots.length > 0 ? Timeslots[Timeslots.length - 1].endDate : formData.end_date;

  console.log("----------INSERT NEW EVENT-----------");
  const { data: inserted, error } = await supabase
    .from("events")
    .insert([buildEventPayload(startDate, endDate)])
    .select();

  if (error) return error;
  if (inserted && Timeslots.length > 0) {
    for (const Timeslot of Timeslots) {
      const { error: slotError } = await supabase.from("event_slots").insert({
        event_id: inserted[0].id,
        starts_at: Timeslot.startDate,
        ends_at: Timeslot.endDate,
        capacity: formData.attendance_cap ? Number(formData.attendance_cap) : null,
      });
      if (slotError) return slotError;
    }
  }
  return null;
};

export const deleteEvent = async (id: string) => {
  console.log("-------------DELETE EVENT-------------");
  const { error } = await supabase.from("events").update({ deleted: true }).eq("id", id);
  return error;
};

export const updateEvent = async (eventId: string, formData: formdata, Timeslots?: DateGroup[]) => {
  const isInternal = formData.internal ?? false;
  const { error } = await supabase
    .from("events")
    .update({
      title: formData.title,
      password: formData.password,
      start_date: formData.start_date,
      end_date: formData.end_date,
      location: formData.location,
      location_str: formData.location_str,
      content: formData.content,
      tags: isInternal ? [] : formData.tags,
      poster: isInternal ? "" : formData.poster,
      attendance_cap: isInternal
        ? null
        : formData.attendance_cap
          ? Number(formData.attendance_cap)
          : null,
      track_attendance: formData.track_attendance ?? false,
      internal: formData.internal ?? false,
      manual_attendance:
        !(formData.track_attendance ?? false) &&
        formData.manual_attendance !== undefined &&
        formData.manual_attendance !== ""
          ? Number(formData.manual_attendance)
          : null,
    })
    .eq("id", eventId);

  if (error) return error;

  if (Timeslots && Timeslots.length > 0) {
    await supabase.from("event_slots").delete().eq("event_id", eventId);
    for (const Timeslot of Timeslots) {
      const { error: slotError } = await supabase.from("event_slots").insert({
        event_id: eventId,
        starts_at: Timeslot.startDate,
        ends_at: Timeslot.endDate,
        capacity: formData.attendance_cap ? Number(formData.attendance_cap) : null,
      });
      if (slotError) return slotError;
    }
  }
  return null;
};

export const queryEventsBySearchAndFilters = async (
  keyword: string,
  tagFilters: string[],
  orgFilters: string[],
  sortMethod: string,
  userId: string | undefined,
  internalFilter?: boolean
) => {
  let query = supabase
    .from("events")
    .select(
      "id,content,created_at,end_date,id,location_str,start_date,tags,title,attendance,poster,rsvp,org_id, orgs!inner(name, pfp_str), attendance_cap, track_attendance, internal, password, manual_attendance, event_slots(id, starts_at, ends_at)"
    )
    .ilike("title", `%${keyword}%`)
    .eq("deleted", false);

  if (internalFilter) query = query.eq("internal", true);

  if (tagFilters.length > 0) query = query.overlaps("tags", tagFilters);

  if (orgFilters.length > 0) {
    query = query.in("orgs.name", orgFilters);
  }

  if (sortMethod === "Event Name (A-Z)") query = query.order("title", { ascending: true });
  else if (sortMethod == "Most Recent") query = query.order("start_date", { ascending: false });
  else query = query.order("start_date", { ascending: false });

  const { data, error } = await query;

  // Filter internal events: only show to users with org membership matching event's org_id
  let filteredEvents = data ?? [];
  if (filteredEvents.length > 0) {
    const internalEvents = filteredEvents.filter(
      (e: { internal?: boolean }) => e.internal === true
    );
    if (internalEvents.length > 0 && userId) {
      const { data: userOrgs } = await supabase
        .from("user_org_roles")
        .select("org_uuid")
        .eq("user_uuid", userId);
      const userOrgIds = new Set((userOrgs ?? []).map((r: { org_uuid: string }) => r.org_uuid));
      filteredEvents = filteredEvents.filter(
        (e: { internal?: boolean; org_id?: string }) =>
          !e.internal || (e.internal && e.org_id && userOrgIds.has(e.org_id))
      );
    } else if (internalEvents.length > 0 && !userId) {
      filteredEvents = filteredEvents.filter((e: { internal?: boolean }) => !e.internal);
    }
  }

  return { events: filteredEvents, error };
};

export const queryPeopleBySearchAndFilters = async (
  keyword: string,
  tagFilters: string[],
  orgFilters: string[],
  sortMethod: string
) => {
  let query = supabase
    .from("users")
    .select("email,created_at,points,resume_link,expected_grad,major,first_name,last_name")
    .or(`first_name.ilike.%${keyword}%, last_name.ilike.%${keyword}%, email.ilike.%${keyword}%`)
    .not("resume_link", "is", null);
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
  return { People: data, error };
};

// for attended events list
export const verifyEventAttendance = async (eventId: string, userId: string, password: string) => {
  console.log("----------VERIFYING EVENT ATTENDANCE-----------");
  const error = await logAttendance(eventId, userId, password);
  // check password, update events_log, update user points/attended list

  if (error) {
    console.log("Attendance verification failed:", error);
  } else {
    console.log("Attendance successfully logged");
  }

  return { error };
};
