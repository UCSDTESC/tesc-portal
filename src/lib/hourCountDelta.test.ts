import { describe, expect, it } from "vitest";
import { hourCountDelta, pruneCountSamples, recordCountSample, type CountSample } from "./hourCountDelta";

const HOUR = 60 * 60 * 1000;

function sample(at: number, rsvp: number, attendance: number): CountSample {
  return { at, rsvp, attendance };
}

describe("hourCountDelta", () => {
  it("is zero until the count changes", () => {
    const samples = recordCountSample(undefined, sample(0, 4, 1), 0);
    expect(hourCountDelta(samples, "rsvp", 0)).toBe(0);
    expect(hourCountDelta(samples, "attendance", 0)).toBe(0);
  });

  it("sums rises and drops inside the hour", () => {
    let samples = recordCountSample(undefined, sample(0, 4, 1), 0);
    samples = recordCountSample(samples, sample(10, 6, 1), 10);
    samples = recordCountSample(samples, sample(20, 5, 3), 20);
    expect(hourCountDelta(samples, "rsvp", 20)).toBe(1);
    expect(hourCountDelta(samples, "attendance", 20)).toBe(2);
  });

  it("drops a change once it is older than an hour", () => {
    let samples = recordCountSample(undefined, sample(0, 4, 1), 0);
    samples = recordCountSample(samples, sample(10, 7, 1), 10);
    const later = 10 + HOUR + 1;
    expect(pruneCountSamples(samples, later)).toEqual([]);
    expect(hourCountDelta(samples, "rsvp", later)).toBe(0);
  });

  it("starts a new hour from the current count after the window expires", () => {
    const refreshed = recordCountSample([sample(0, 4, 1)], sample(HOUR + 1, 4, 1), HOUR + 1);
    expect(refreshed).toEqual([sample(HOUR + 1, 4, 1)]);
    expect(hourCountDelta(refreshed, "rsvp", HOUR + 1)).toBe(0);
  });

  it("ignores a repeated reading of the same counts", () => {
    const samples = recordCountSample([sample(0, 4, 1)], sample(5, 4, 1), 5);
    expect(samples).toEqual([sample(0, 4, 1)]);
  });
});
