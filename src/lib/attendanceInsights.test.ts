import { describe, expect, it } from "vitest";
import {
  filterDailyByDateRange,
  formatNextEventHint,
  groupDailyByPeriod,
  insightCountsForSelection,
  percentChangeHint,
  type OrgAttendanceInsightsPayload,
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

describe("insightCountsForSelection", () => {
  const payload: OrgAttendanceInsightsPayload = {
    daily: [],
    tags: [],
    venues: [],
    timeOfDay: [],
    orgs: [],
    majors: [],
    years: [],
    events: [
      {
        id: "408",
        title: "Engineers On The Green",
        startDate: "2026-09-29T00:00:00.000Z",
        openRsvps: 226,
        checkins: 533,
        uniqueAttendees: 533,
      },
    ],
    uniqueAttendees: 900,
    totalCheckins: 1200,
    totalRsvps: 433,
    attendedLast30: 10,
    attendedPrev30: 8,
    upcomingEvents: 2,
    nextEventStart: null,
  };

  it("uses org-wide totals when no event is selected", () => {
    expect(insightCountsForSelection(payload, null)).toEqual({
      checkins: 1200,
      uniqueAttendees: 900,
      openRsvps: 433,
    });
  });

  it("uses the selected event's open RSVP count", () => {
    expect(insightCountsForSelection(payload, "408")).toEqual({
      checkins: 533,
      uniqueAttendees: 533,
      openRsvps: 226,
    });
  });

  it("falls back to org totals when the event has no per-event counts", () => {
    const withoutCounts: OrgAttendanceInsightsPayload = {
      ...payload,
      events: [{ id: "408", title: "Engineers On The Green", startDate: null }],
    };
    expect(insightCountsForSelection(withoutCounts, "408")).toEqual({
      checkins: 1200,
      uniqueAttendees: 900,
      openRsvps: 433,
    });
  });
});
