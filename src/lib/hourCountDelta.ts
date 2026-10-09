export const HOUR_MS = 60 * 60 * 1000;

export type CountSample = {
  at: number;
  rsvp: number;
  attendance: number;
};

export type CountSampleLog = Record<string, CountSample[]>;

const STORAGE_KEY = "posted-event-count-samples";

export function pruneCountSamples(
  samples: CountSample[],
  now: number,
  windowMs = HOUR_MS,
): CountSample[] {
  if (samples.length === 0) return samples;
  const cutoff = now - windowMs;
  let baselineIndex = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].at <= cutoff) baselineIndex = i;
    else break;
  }
  if (samples[baselineIndex].at <= cutoff && baselineIndex === samples.length - 1) {
    return [];
  }
  if (baselineIndex === 0) return samples;
  return samples.slice(baselineIndex);
}

export function recordCountSample(
  samples: CountSample[] | undefined,
  sample: CountSample,
  now = sample.at,
  windowMs = HOUR_MS,
): CountSample[] {
  const list = samples ?? [];
  const last = list[list.length - 1];
  const appended =
    last && last.rsvp === sample.rsvp && last.attendance === sample.attendance
      ? list
      : [...list, sample];
  const pruned = pruneCountSamples(appended, now, windowMs);
  if (pruned.length === 0) return [sample];
  return pruned;
}

export function noteEventCounts<
  T extends { id: string | number; rsvp: number; attendance: number },
>(log: CountSampleLog, events: T[], now = Date.now()) {
  let next = log;
  const stamped = events.map((event) => {
    const id = String(event.id);
    const recorded = recordCountSample(
      next[id],
      {
        at: now,
        rsvp: Number.isFinite(event.rsvp) ? event.rsvp : 0,
        attendance: Number.isFinite(event.attendance) ? event.attendance : 0,
      },
      now,
    );
    if (recorded !== next[id]) {
      if (next === log) next = { ...log };
      next[id] = recorded;
    }
    return {
      ...event,
      rsvp_hour_delta: hourCountDelta(recorded, "rsvp", now),
      attendance_hour_delta: hourCountDelta(recorded, "attendance", now),
    };
  });
  return { log: next, events: stamped };
}

export function hourCountDelta(
  samples: CountSample[] | undefined,
  field: "rsvp" | "attendance",
  now: number,
  windowMs = HOUR_MS,
): number {
  if (!samples || samples.length === 0) return 0;
  const pruned = pruneCountSamples(samples, now, windowMs);
  if (pruned.length === 0) return 0;
  return pruned[pruned.length - 1][field] - pruned[0][field];
}

export function loadCountSamples(): CountSampleLog {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CountSampleLog;
    const now = Date.now();
    const pruned: CountSampleLog = {};
    for (const [id, samples] of Object.entries(parsed)) {
      if (!Array.isArray(samples)) continue;
      pruned[id] = pruneCountSamples(samples, now);
    }
    return pruned;
  } catch {
    return {};
  }
}

export function saveCountSamples(log: CountSampleLog) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // Ignore private-mode and quota failures. The badge still works for this page view.
  }
}
