import { describe, expect, it } from "vitest";
import { formatGoogleCalendarEvent, googleCalendarStamp } from "./googleCalendar";

describe("google calendar stamps", () => {
  it("converts a UTC instant to Pacific wall time", () => {
    // Nov 12 2026 is PST (UTC-8): 23:00 UTC is 3:00 PM.
    expect(googleCalendarStamp("2026-11-12T23:00:00+00:00")).toBe("20261112T150000");
    expect(googleCalendarStamp("2026-11-13T01:00:00+00:00")).toBe("20261112T170000");
  });

  it("keeps the previous Pacific evening when UTC is already the next day", () => {
    // Oct 21 2026 00:00 UTC is still PDT (UTC-7): 5:00 PM on Oct 20.
    expect(googleCalendarStamp("2026-10-21T00:00:00.000Z")).toBe("20261020T170000");
  });

  it("puts those Pacific times in the calendar link", () => {
    const url = new URL(
      formatGoogleCalendarEvent(
        "RTX x TESC Workshop",
        "Price Center",
        "2026-11-12T23:00:00+00:00",
        "2026-11-13T01:00:00+00:00",
      ),
    );
    expect(url.searchParams.get("dates")).toBe("20261112T150000/20261112T170000");
    expect(url.searchParams.get("ctz")).toBe("America/Los_Angeles");
    expect(url.searchParams.get("text")).toBe("RTX x TESC Workshop");
  });
});
