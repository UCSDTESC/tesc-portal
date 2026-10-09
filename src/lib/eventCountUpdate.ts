export type EventCountPatch = {
  id?: string | number | null;
  rsvp?: unknown;
  attendance?: unknown;
};

function asCount(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function applyEventCountUpdate<
  T extends { id: string | number; rsvp: number; attendance: number },
>(events: T[] | null, next: EventCountPatch): T[] | null {
  if (!events || next.id == null || next.id === "") return events;

  const id = String(next.id);
  const index = events.findIndex((event) => String(event.id) === id);
  if (index === -1) return events;

  const event = events[index];
  const rsvp = asCount(next.rsvp, event.rsvp);
  const attendance = asCount(next.attendance, event.attendance);
  if (rsvp === event.rsvp && attendance === event.attendance) return events;

  const updated = events.slice();
  updated[index] = { ...event, rsvp, attendance };
  return updated;
}
