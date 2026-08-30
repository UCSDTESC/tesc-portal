import { describe, expect, it } from "vitest";
import {
  getSlotQrAction,
  hasEventStarted,
  isEventEnded,
  isEventNotStarted,
  isSlotActive,
  isSlotFuture,
} from "./slotTime";
import type { EventSlot } from "@lib/constants";
const slot = (id: string, start: string, end: string): EventSlot => ({
  id,
  event_id: "1",
  starts_at: start,
  ends_at: end,
  capacity: 10,
  rsvp_count: 0,
  attended_count: 0,
});

describe("slotTime", () => {
  const slots = [
    slot("1", "2030-06-01T18:00:00", "2030-06-01T19:00:00"),
    slot("2", "2030-06-01T20:00:00", "2030-06-01T21:00:00"),
  ];

  it("detects event not started when all slots are future", () => {
    const now = new Date("2030-06-01T12:00:00");
    expect(isEventNotStarted(slots, now)).toBe(true);
    expect(hasEventStarted(slots, now)).toBe(false);
  });

  it("detects event started when any slot is in check-in window", () => {
    const now = new Date("2030-06-01T18:30:00");
    expect(isEventNotStarted(slots, now)).toBe(false);
    expect(hasEventStarted(slots, now)).toBe(true);
    expect(isSlotActive(slots[0], now)).toBe(true);
    expect(isSlotFuture(slots[1], now)).toBe(true);
  });

  it("detects event started during grace before first slot", () => {
    const now = new Date("2030-06-01T17:50:00");
    expect(isEventNotStarted(slots, now)).toBe(false);
    expect(isSlotFuture(slots[0], now)).toBe(false);
  });

  it("handles UTC timestamps from the database", () => {
    const utcSlots = [
      slot("1", "2030-06-01T18:00:00+00:00", "2030-06-01T19:00:00+00:00"),
    ];
    const beforeStart = new Date("2030-06-01T10:00:00-07:00");
    const duringSlot = new Date("2030-06-01T11:30:00-07:00");
    expect(isEventNotStarted(utcSlots, beforeStart)).toBe(true);
    expect(isEventNotStarted(utcSlots, duringSlot)).toBe(false);
    expect(getSlotQrAction(utcSlots[0], duringSlot)).toBe("checkin");
  });

  it("detects ended event", () => {
    const now = new Date("2030-06-02T00:00:00");
    expect(isEventEnded(slots, now)).toBe(true);
  });
});

describe("getSlotQrAction", () => {
  const slot = (id: string, start: string, end: string): EventSlot => ({
    id,
    event_id: "1",
    starts_at: start,
    ends_at: end,
    capacity: 10,
    rsvp_count: 0,
    attended_count: 0,
  });

  it("returns register before slot starts", () => {
    const s = slot("1", "2030-06-01T18:00:00", "2030-06-01T19:00:00");
    const now = new Date("2030-06-01T12:00:00");
    expect(getSlotQrAction(s, now)).toBe("register");
  });

  it("returns checkin while slot is active", () => {
    const s = slot("1", "2030-06-01T18:00:00", "2030-06-01T19:00:00");
    const now = new Date("2030-06-01T18:30:00");
    expect(getSlotQrAction(s, now)).toBe("checkin");
  });

  it("returns ended after slot grace period", () => {
    const s = slot("1", "2030-06-01T18:00:00", "2030-06-01T19:00:00");
    const now = new Date("2030-06-01T20:00:00");
    expect(getSlotQrAction(s, now)).toBe("ended");
  });
});
