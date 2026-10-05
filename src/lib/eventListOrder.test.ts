import { describe, expect, it } from "vitest";
import { compareEventsByRecency, eventSortTime, type SortableEvent } from "./eventListOrder";

const NOW = new Date("2026-09-28T18:00:00Z").getTime();

function event(partial: SortableEvent): SortableEvent {
  return partial;
}

describe("event list order", () => {
  it("puts the soonest upcoming event first", () => {
    const tomorrow = event({ start_date: "2026-09-29T18:00:00Z" });
    const nextMonth = event({ start_date: "2026-10-28T18:00:00Z" });
    const thisWeek = event({ start_date: "2026-10-01T18:00:00Z" });

    const ordered = [nextMonth, tomorrow, thisWeek].sort((a, b) =>
      compareEventsByRecency(a, b, "current", NOW),
    );

    expect(ordered.map((item) => item.start_date)).toEqual([
      tomorrow.start_date,
      thisWeek.start_date,
      nextMonth.start_date,
    ]);
  });

  it("orders an ongoing multi-slot event by its next session, not its first", () => {
    const series = event({
      start_date: "2026-01-01T18:00:00Z",
      slots: [
        { starts_at: "2026-01-01T18:00:00Z", ends_at: "2026-01-01T20:00:00Z" },
        { starts_at: "2026-10-02T18:00:00Z", ends_at: "2026-10-02T20:00:00Z" },
      ],
    });
    const soon = event({ start_date: "2026-09-30T18:00:00Z" });

    expect(eventSortTime(series, NOW)).toBe(new Date("2026-10-02T18:00:00Z").getTime());
    expect(compareEventsByRecency(series, soon, "current", NOW)).toBeGreaterThan(0);
  });

  it("puts the most recently occurred past event first", () => {
    const lastWeek = event({ start_date: "2026-09-20T18:00:00Z", end_date: "2026-09-20T20:00:00Z" });
    const yesterday = event({
      start_date: "2026-09-27T18:00:00Z",
      end_date: "2026-09-27T20:00:00Z",
    });
    const lastYear = event({ start_date: "2025-09-28T18:00:00Z", end_date: "2025-09-28T20:00:00Z" });

    const ordered = [lastYear, lastWeek, yesterday].sort((a, b) =>
      compareEventsByRecency(a, b, "past", NOW),
    );

    expect(ordered.map((item) => item.start_date)).toEqual([
      yesterday.start_date,
      lastWeek.start_date,
      lastYear.start_date,
    ]);
  });
});
