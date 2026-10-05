export type EventListTimeFilter = "current" | "past";

type SortableSlot = {
  starts_at?: string | null;
  ends_at?: string | null;
};

export type SortableEvent = {
  created_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  slots?: SortableSlot[] | null;
};

export function parseEventTime(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  const t = new Date(str).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Next open slot, or the latest slot when the event is already over. */
function anchorSlot(event: SortableEvent, now: number): SortableSlot | undefined {
  const slots = [...(event.slots ?? [])].sort(
    (a, b) => (parseEventTime(a.starts_at) ?? 0) - (parseEventTime(b.starts_at) ?? 0),
  );
  const nextOpen = slots.find((slot) => {
    const end = parseEventTime(slot.ends_at);
    return end === null || end >= now;
  });
  return nextOpen ?? slots[slots.length - 1];
}

/** Time used to place an event: the next session, otherwise when it starts. */
export function eventSortTime(event: SortableEvent, now = Date.now()): number {
  const slot = anchorSlot(event, now);
  return (
    parseEventTime(slot?.starts_at) ??
    parseEventTime(event.start_date) ??
    parseEventTime(event.end_date) ??
    parseEventTime(event.created_at) ??
    0
  );
}

/**
 * Upcoming lists put the soonest event first.
 * Past lists put the most recently occurred event first.
 * Equal times fall back to newest created event.
 */
export function compareEventsByRecency(
  a: SortableEvent,
  b: SortableEvent,
  eventTimeFilter: EventListTimeFilter,
  now = Date.now(),
): number {
  const diff =
    eventTimeFilter === "current"
      ? eventSortTime(a, now) - eventSortTime(b, now)
      : eventSortTime(b, now) - eventSortTime(a, now);
  if (diff !== 0) return diff;
  return (parseEventTime(b.created_at) ?? 0) - (parseEventTime(a.created_at) ?? 0);
}
