import type { EventSlot } from "@lib/constants";
import { isEventEnded } from "@lib/slotTime";

export type QrFlowState =
  | { mode: "auth-required" }
  | { mode: "done"; reason: "already-attended" | "event-ended" | "completed" }
  | { mode: "pick-slot" };

export function resolveQrFlowState(options: {
  isLoggedIn: boolean;
  hasAttended: boolean;
  slots: EventSlot[];
  alreadyCompletedSession: boolean;
  now?: Date;
}): QrFlowState {
  const { isLoggedIn, hasAttended, slots, alreadyCompletedSession, now = new Date() } = options;

  if (!isLoggedIn) return { mode: "auth-required" };
  if (hasAttended || alreadyCompletedSession) return { mode: "done", reason: "already-attended" };
  if (!slots.length || isEventEnded(slots, now)) return { mode: "done", reason: "event-ended" };
  return { mode: "pick-slot" };
}