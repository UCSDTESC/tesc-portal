import { describe, expect, it } from "vitest";
import {
  deriveAttendanceCap,
  deriveEventRange,
  localDatetimeToStorage,
  shiftSlots,
  validateEventSlots,
} from "./eventSlotUtils";

describe("event slot helpers", () => {
  it("derives overall event range from multiple slots", () => {
    const range = deriveEventRange([
      { starts_at: "2026-03-01T10:00", ends_at: "2026-03-01T11:00", capacity: 5 },
      { starts_at: "2026-03-01T14:00", ends_at: "2026-03-01T16:00", capacity: 10 },
    ]);
    expect(range).not.toBeNull();
    expect(new Date(range!.start_date).getTime()).toBe(new Date("2026-03-01T10:00").getTime());
    expect(new Date(range!.end_date).getTime()).toBe(new Date("2026-03-01T16:00").getTime());
  });

  it("sums slot capacities when all slots have caps", () => {
    expect(
      deriveAttendanceCap([
        { starts_at: "2026-03-01T10:00", ends_at: "2026-03-01T11:00", capacity: 5 },
        { starts_at: "2026-03-01T14:00", ends_at: "2026-03-01T16:00", capacity: 10 },
      ]),
    ).toBe(15);
  });

  it("returns null attendance cap when any slot is unlimited", () => {
    expect(
      deriveAttendanceCap([
        { starts_at: "2026-03-01T10:00", ends_at: "2026-03-01T11:00", capacity: 5 },
        { starts_at: "2026-03-01T14:00", ends_at: "2026-03-01T16:00", capacity: null },
      ]),
    ).toBeNull();
  });

  it("validates slot ordering and presence", () => {
    expect(validateEventSlots([])).toMatch(/at least one/i);
    expect(
      validateEventSlots([
        { starts_at: "2026-03-01T14:00", ends_at: "2026-03-01T10:00", capacity: 1 },
      ]),
    ).toMatch(/after its start/i);
    expect(
      validateEventSlots([
        { starts_at: "2026-03-01T10:00", ends_at: "2026-03-01T11:00", capacity: 1 },
      ]),
    ).toBeNull();
  });

  it("converts local datetime-local input to UTC ISO for storage", () => {
    const stored = localDatetimeToStorage("2030-06-01T18:00");
    expect(stored).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(new Date(stored).getTime()).toBe(new Date("2030-06-01T18:00").getTime());
  });

  it("shifts all slots by the same offset for recurring events", () => {
    const original = {
      starts_at: "2026-03-01T10:00",
      ends_at: "2026-03-01T11:00",
      capacity: 2,
    };
    const offsetMs = 24 * 60 * 60 * 1000;
    const shifted = shiftSlots([original], offsetMs);
    const originalDuration =
      new Date(original.ends_at).getTime() - new Date(original.starts_at).getTime();
    const shiftedDuration =
      new Date(shifted[0].ends_at).getTime() - new Date(shifted[0].starts_at).getTime();
    expect(shiftedDuration).toBe(originalDuration);
    expect(new Date(shifted[0].starts_at).getTime()).toBeGreaterThan(
      new Date(original.starts_at).getTime(),
    );
  });
});
