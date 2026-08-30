import type { EventSlot } from "@lib/constants";

export const CHECKIN_GRACE_BEFORE_MS = 15 * 60 * 1000;
export const CHECKIN_GRACE_AFTER_MS = 30 * 60 * 1000;

export function parseSlotTime(iso: string): Date {
  const parsed = new Date(iso);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(iso.replace("+00:00", ""));
}

export function isSlotFull(slot: EventSlot): boolean {
  if (slot.capacity == null) return false;
  return slot.rsvp_count >= slot.capacity;
}

export function isSlotEnded(slot: EventSlot, now: Date = new Date()): boolean {
  const end = parseSlotTime(slot.ends_at).getTime() + CHECKIN_GRACE_AFTER_MS;
  return now.getTime() > end;
}

export function isSlotFuture(slot: EventSlot, now: Date = new Date()): boolean {
  const start = parseSlotTime(slot.starts_at).getTime() - CHECKIN_GRACE_BEFORE_MS;
  return now.getTime() < start;
}

export function isSlotActive(slot: EventSlot, now: Date = new Date()): boolean {
  const start = parseSlotTime(slot.starts_at).getTime() - CHECKIN_GRACE_BEFORE_MS;
  const end = parseSlotTime(slot.ends_at).getTime() + CHECKIN_GRACE_AFTER_MS;
  const t = now.getTime();
  return t >= start && t <= end;
}

export function getEventBounds(slots: EventSlot[]): { start: Date; end: Date } | null {
  if (!slots.length) return null;
  const sorted = [...slots].sort(
    (a, b) => parseSlotTime(a.starts_at).getTime() - parseSlotTime(b.starts_at).getTime(),
  );
  return {
    start: parseSlotTime(sorted[0].starts_at),
    end: parseSlotTime(sorted[sorted.length - 1].ends_at),
  };
}

export function isEventEnded(slots: EventSlot[], now: Date = new Date()): boolean {
  return slots.length > 0 && slots.every((slot) => isSlotEnded(slot, now));
}

export function isEventNotStarted(slots: EventSlot[], now: Date = new Date()): boolean {
  if (!slots.length) return true;
  return slots.every((slot) => isSlotFuture(slot, now));
}

export function hasEventStarted(slots: EventSlot[], now: Date = new Date()): boolean {
  if (!slots.length) return false;
  return slots.some((slot) => !isSlotFuture(slot, now));
}

/** Per-slot QR/bulletin action based on whether the slot window is open. */
export function getSlotQrAction(
  slot: EventSlot,
  now: Date = new Date(),
): "register" | "checkin" | "ended" {
  if (isSlotEnded(slot, now)) return "ended";
  if (isSlotFuture(slot, now)) return "register";
  return "checkin";
}
