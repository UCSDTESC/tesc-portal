import { EventSlotForm } from "@lib/constants";

export function deriveAttendanceCap(slots: EventSlotForm[]) {
  if (!slots.length) return null;
  if (slots.some((slot) => slot.capacity == null || slot.capacity === undefined)) return null;
  return slots.reduce((sum, slot) => sum + Number(slot.capacity ?? 0), 0);
}

export function deriveEventRange(slots: EventSlotForm[]) {
  if (!slots.length) return null;
  const starts = slots.map((slot) => new Date(slot.starts_at).getTime()).filter((t) => !Number.isNaN(t));
  const ends = slots.map((slot) => new Date(slot.ends_at).getTime()).filter((t) => !Number.isNaN(t));
  if (!starts.length || !ends.length) return null;
  return {
    start_date: new Date(Math.min(...starts)).toISOString(),
    end_date: new Date(Math.max(...ends)).toISOString(),
  };
}

export function shiftSlots(slots: EventSlotForm[], offsetMs: number): EventSlotForm[] {
  return slots.map((slot) => {
    const start = new Date(slot.starts_at);
    const end = new Date(slot.ends_at);
    start.setTime(start.getTime() + offsetMs);
    end.setTime(end.getTime() + offsetMs);
    return {
      ...slot,
      id: undefined,
      starts_at: start.toISOString().slice(0, 16),
      ends_at: end.toISOString().slice(0, 16),
    };
  });
}

export function validateEventSlots(slots: EventSlotForm[] | undefined) {
  if (!slots?.length) return "Add at least one time slot.";
  for (const slot of slots) {
    if (!slot.starts_at || !slot.ends_at) return "Each time slot needs a start and end time.";
    if (new Date(slot.ends_at).getTime() <= new Date(slot.starts_at).getTime()) {
      return "Each time slot end must be after its start.";
    }
  }
  return null;
}
