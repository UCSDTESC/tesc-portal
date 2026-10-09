import { describe, expect, it } from "vitest";
import { applyEventCountUpdate } from "./eventCountUpdate";

const events = [
  { id: "1", rsvp: 4, attendance: 1, title: "Workshop" },
  { id: "2", rsvp: 0, attendance: 0, title: "Social" },
];

describe("applyEventCountUpdate", () => {
  it("patches rsvp and attendance on the matching event", () => {
    const next = applyEventCountUpdate(events, { id: 1, rsvp: 5, attendance: 2 });
    expect(next?.[0]).toMatchObject({ id: "1", rsvp: 5, attendance: 2, title: "Workshop" });
    expect(next?.[1]).toBe(events[1]);
    expect(next).not.toBe(events);
  });

  it("accepts numeric counts sent as strings", () => {
    const next = applyEventCountUpdate(events, { id: "2", rsvp: "3", attendance: "1" });
    expect(next?.[1]).toMatchObject({ rsvp: 3, attendance: 1 });
  });

  it("leaves the list alone when the event is not on screen", () => {
    expect(applyEventCountUpdate(events, { id: "9", rsvp: 8, attendance: 8 })).toBe(events);
  });

  it("leaves the list alone when the counts did not change", () => {
    expect(applyEventCountUpdate(events, { id: "1", rsvp: 4, attendance: 1 })).toBe(events);
  });
});
