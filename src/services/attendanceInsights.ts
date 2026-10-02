import supabase from "@server/supabase";
import {
  emptyInsightsPayload,
  type DailyAttendance,
  type OrgAttendanceInsightsPayload,
  type PieSlice,
} from "@lib/attendanceInsights";

function asSlices(raw: unknown): PieSlice[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const item = row as { label?: unknown; value?: unknown };
    return {
      label: String(item.label ?? "Unknown"),
      value: Number(item.value ?? 0),
    };
  });
}

function asDaily(raw: unknown): DailyAttendance[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const item = row as { day?: unknown; attended?: unknown; rsvp?: unknown };
    return {
      day: String(item.day ?? "").slice(0, 10),
      attended: Number(item.attended ?? 0),
      rsvp: Number(item.rsvp ?? 0),
    };
  });
}

function asEvents(raw: unknown): OrgAttendanceInsightsPayload["events"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const item = row as { id?: unknown; title?: unknown; startDate?: unknown };
    return {
      id: String(item.id ?? ""),
      title: String(item.title ?? "Untitled event"),
      startDate: item.startDate ? String(item.startDate) : null,
    };
  }).filter((row) => row.id);
}

export async function fetchOrgAttendanceInsights(
  orgId: number | null,
  eventId: number | null = null,
) {
  const { data, error } = await supabase.rpc("get_org_attendance_insights", {
    p_org_id: orgId,
    p_event_id: eventId,
  });
  if (error) return { payload: emptyInsightsPayload(), error };

  const raw = (data ?? {}) as Record<string, unknown>;
  const payload: OrgAttendanceInsightsPayload = {
    ...emptyInsightsPayload(),
    daily: asDaily(raw.daily),
    tags: asSlices(raw.tags),
    venues: asSlices(raw.venues),
    timeOfDay: asSlices(raw.timeOfDay),
    orgs: asSlices(raw.orgs),
    majors: asSlices(raw.majors),
    years: asSlices(raw.years),
    events: asEvents(raw.events),
    uniqueAttendees: Number(raw.uniqueAttendees ?? 0),
    totalCheckins: Number(raw.totalCheckins ?? 0),
    totalRsvps: Number(raw.totalRsvps ?? 0),
    attendedLast30: Number(raw.attendedLast30 ?? 0),
    attendedPrev30: Number(raw.attendedPrev30 ?? 0),
    upcomingEvents: Number(raw.upcomingEvents ?? 0),
    nextEventStart: raw.nextEventStart ? String(raw.nextEventStart) : null,
  };
  return { payload, error: null };
}
