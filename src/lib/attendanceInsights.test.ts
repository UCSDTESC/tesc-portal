import { describe, expect, it } from "vitest";
import {
  filterDailyByDateRange,
  formatNextEventHint,
  groupDailyByPeriod,
  percentChangeHint,
} from "./attendanceInsights";

const daily = [
  { day: "2026-01-01", attended: 2, rsvp: 1 },
  { day: "2026-01-02", attended: 3, rsvp: 0 },
  { day: "2026-01-08", attended: 1, rsvp: 4 },
];

describe("groupDailyByPeriod", () => {
  it("fills missing daily points", () => {
    const grouped = groupDailyByPeriod(daily, "daily");
    expect(grouped[0]).toEqual({ label: "2026-01-01", count: 2 });
    expect(grouped.find((row) => row.label === "2026-01-03")).toEqual({
      label: "2026-01-03",
      count: 0,
    });
    expect(grouped.find((row) => row.label === "2026-01-08")?.count).toBe(1);
  });

  it("rolls days into weekly buckets starting Monday", () => {
    const grouped = groupDailyByPeriod(daily, "weekly");
    expect(grouped[0]?.label).toBe("2025-12-29");
    expect(grouped[0]?.count).toBe(5);
    expect(grouped[1]?.label).toBe("2026-01-05");
    expect(grouped[1]?.count).toBe(1);
  });
});

describe("filterDailyByDateRange", () => {
  it("keeps rows inside the inclusive range", () => {
    expect(filterDailyByDateRange(daily, "2026-01-02", "2026-01-08")).toEqual([
      { day: "2026-01-02", attended: 3, rsvp: 0 },
      { day: "2026-01-08", attended: 1, rsvp: 4 },
    ]);
  });
});

describe("percentChangeHint", () => {
  it("formats a percent when there is a previous baseline", () => {
    expect(percentChangeHint(12, 8)).toBe("+50.0% past 30 days");
    expect(percentChangeHint(4, 8)).toBe("-50.0% past 30 days");
  });
});

describe("formatNextEventHint", () => {
  it("returns a short date label", () => {
    expect(formatNextEventHint("2026-10-15T18:00:00.000Z")).toMatch(/^Next: /);
  });
});
