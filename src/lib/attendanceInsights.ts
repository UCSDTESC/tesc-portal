export type LineChartGroupBy = "daily" | "weekly" | "monthly" | "quarterly";

export type PieSlice = { label: string; value: number };

export type DailyAttendance = {
  day: string;
  attended: number;
  rsvp: number;
};

export type GroupedAttendanceItem = {
  label: string;
  count: number;
};

export type InsightEventOption = {
  id: string;
  title: string;
  startDate: string | null;
  openRsvps?: number;
  checkins?: number;
  uniqueAttendees?: number;
};

export type OrgAttendanceInsightsPayload = {
  daily: DailyAttendance[];
  tags: PieSlice[];
  venues: PieSlice[];
  timeOfDay: PieSlice[];
  orgs: PieSlice[];
  majors: PieSlice[];
  years: PieSlice[];
  events: InsightEventOption[];
  uniqueAttendees: number;
  totalCheckins: number;
  totalRsvps: number;
  attendedLast30: number;
  attendedPrev30: number;
  upcomingEvents: number;
  nextEventStart: string | null;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseDay(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, date ?? 1);
}

function formatDay(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getDayKey(day: string) {
  return day.slice(0, 10);
}

function getWeekKey(day: string) {
  const date = parseDay(day);
  const weekday = date.getDay();
  const diff = date.getDate() - weekday + (weekday === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return formatDay(monday);
}

function getMonthKey(day: string) {
  return day.slice(0, 7);
}

function getQuarterKey(day: string) {
  const date = parseDay(day);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

const KEY_FN: Record<LineChartGroupBy, (day: string) => string> = {
  daily: getDayKey,
  weekly: getWeekKey,
  monthly: getMonthKey,
  quarterly: getQuarterKey,
};

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function allKeysInRange(minDay: string, maxDay: string, groupBy: LineChartGroupBy): string[] {
  const keys: string[] = [];
  const min = parseDay(minDay);
  const max = parseDay(maxDay);

  if (groupBy === "daily") {
    let cursor = new Date(min);
    while (cursor <= max) {
      keys.push(formatDay(cursor));
      cursor = addDays(cursor, 1);
    }
    return keys;
  }

  if (groupBy === "weekly") {
    const weekday = min.getDay();
    const diff = min.getDate() - weekday + (weekday === 0 ? -6 : 1);
    let cursor = new Date(min.getFullYear(), min.getMonth(), diff);
    while (cursor <= max) {
      keys.push(formatDay(cursor));
      cursor = addDays(cursor, 7);
    }
    return keys;
  }

  if (groupBy === "monthly") {
    let cursor = new Date(min.getFullYear(), min.getMonth(), 1);
    while (cursor <= max) {
      keys.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`);
      cursor = addMonths(cursor, 1);
    }
    return keys;
  }

  const quarter = Math.floor(min.getMonth() / 3) + 1;
  let cursor = new Date(min.getFullYear(), (quarter - 1) * 3, 1);
  while (cursor <= max) {
    keys.push(`${cursor.getFullYear()}-Q${Math.floor(cursor.getMonth() / 3) + 1}`);
    cursor = addMonths(cursor, 3);
  }
  return keys;
}

export function filterDailyByDateRange(
  daily: DailyAttendance[],
  startDate: string,
  endDate: string,
): DailyAttendance[] {
  if (!startDate && !endDate) return daily;
  return daily.filter((row) => {
    if (startDate && row.day < startDate) return false;
    if (endDate && row.day > endDate) return false;
    return true;
  });
}

export function groupDailyByPeriod(
  daily: DailyAttendance[],
  groupBy: LineChartGroupBy,
  metric: "attended" | "rsvp" = "attended",
): GroupedAttendanceItem[] {
  if (!daily.length) return [];
  const keyFn = KEY_FN[groupBy];
  const countMap = new Map<string, number>();
  for (const row of daily) {
    const key = keyFn(row.day);
    countMap.set(key, (countMap.get(key) ?? 0) + Number(row[metric] ?? 0));
  }
  const sortedKeys = allKeysInRange(daily[0].day, daily[daily.length - 1].day, groupBy);
  return sortedKeys.map((label) => ({ label, count: countMap.get(label) ?? 0 }));
}

export function percentChangeHint(current: number, previous: number, suffix = "past 30 days") {
  if (previous <= 0) {
    return current > 0 ? `+${current} ${suffix}` : `0 ${suffix}`;
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% ${suffix}`;
}

export function formatStatNumber(value: number) {
  return value.toLocaleString();
}

export function formatNextEventHint(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `Next: ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function insightCountsForSelection(
  payload: OrgAttendanceInsightsPayload,
  selectedEventId?: string | null,
) {
  const event = selectedEventId
    ? payload.events.find((row) => row.id === selectedEventId)
    : undefined;
  return {
    checkins: event?.checkins ?? payload.totalCheckins,
    uniqueAttendees: event?.uniqueAttendees ?? payload.uniqueAttendees,
    openRsvps: event?.openRsvps ?? payload.totalRsvps,
  };
}

export function emptyInsightsPayload(): OrgAttendanceInsightsPayload {
  return {
    daily: [],
    tags: [],
    venues: [],
    timeOfDay: [],
    orgs: [],
    majors: [],
    years: [],
    events: [],
    uniqueAttendees: 0,
    totalCheckins: 0,
    totalRsvps: 0,
    attendedLast30: 0,
    attendedPrev30: 0,
    upcomingEvents: 0,
    nextEventStart: null,
  };
}
