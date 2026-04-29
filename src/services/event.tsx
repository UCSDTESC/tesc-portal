import supabase from "@server/supabase";
import { formdata } from "@lib/constants";
import { logAttendance } from "./user";

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

function addDurationToDate(dateStr: string, durationMs: number): string {
  const d = new Date(dateStr);
  d.setTime(d.getTime() + durationMs);
  return d.toISOString().slice(0, 16);
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
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,content,created_at,end_date,location_str,start_date,tags,title,attendance,poster,rsvp,org_id, orgs!inner(name, pfp_str), attendance_cap, track_attendance, type, password, manual_attendance"
      )
      .eq("deleted", false);
    return { data, error };
  }
  console.log("FETCH USER ORGS");
  const { data: orgs, error } = await supabase
    .from("user_org_roles")
    .select("org_uuid")
    .eq("user_uuid", uid);
  if (error) return { data: null, error };
  else {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,content,created_at,end_date,location_str,start_date,tags,title,attendance,poster,rsvp,org_id, orgs!inner(name, pfp_str), attendance_cap, track_attendance, type, password, manual_attendance"
      )
      .in(
        "org_id",
        orgs.map((org) => org.org_uuid)
      )
      .eq("deleted", false);
    return { data, error };
  }
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

  const buildEventPayload = (startDate: string, endDate: string) => ({
    title: formData.title,
    password: formData.password,
    start_date: isForum ? (null as unknown as string) : startDate,
    end_date: isForum ? (null as unknown as string) : endDate,
    location: isForum ? [] : formData.location,
    location_str: isForum ? "" : formData.location_str,
    content: formData.content,
    tags: isInternal || isForum ? [] : formData.tags,
    org_id: org_name[0].uuid,
    poster: isInternal ? "" : formData.poster,
    attendance_cap: isInternal || isForum
      ? null
      : formData.attendance_cap
        ? Number(formData.attendance_cap)
        : null,
    track_attendance: isInternal || isForum ? false : formData.track_attendance ?? false,
    type: eventType,
    manual_attendance: isForum
      ? null
      : !(formData.track_attendance ?? false) &&
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
    const { error } = await supabase.from("events").insert(eventsToInsert);
    return error;
  }

  console.log("----------INSERT NEW EVENT-----------");
  const { error } = await supabase
    .from("events")
    .insert([buildEventPayload(formData.start_date, formData.end_date)]);
  return error;
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
  const { error } = await supabase
    .from("events")
    .update({
      title: formData.title,
      password: formData.password,
      start_date: isForum ? (null as unknown as string) : formData.start_date,
      end_date: isForum ? (null as unknown as string) : formData.end_date,
      location: isForum ? [] : formData.location,
      location_str: isForum ? "" : formData.location_str,
      content: formData.content,
      tags: isInternal || isForum ? [] : formData.tags,
      poster: isInternal ? "" : formData.poster,
      attendance_cap: isInternal || isForum
        ? null
        : formData.attendance_cap
        ? Number(formData.attendance_cap)
        : null,
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
  return error;
};

export const queryEventsBySearchAndFilters = async (
  keyword: string,
  tagFilters: string[],
  orgFilters: string[],
  typeFilters: string[],
  sortMethod: string,
  userId: string | undefined,
  internalFilter?: boolean
) => {
  const { internalFilter = false, isSuperOrg = false } = options ?? {};
  let query = supabase
    .from("events")
    .select(
      "id,content,created_at,end_date,id,location_str,start_date,tags,title,attendance,poster,rsvp,org_id, orgs!inner(name, pfp_str), attendance_cap, track_attendance, type, password, manual_attendance"
    )
    .ilike("title", `%${keyword}%`)
    .eq("deleted", false);

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
