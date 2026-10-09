const PACIFIC = "America/Los_Angeles";

/** UTC timestamptz → Google Calendar local stamp in America/Los_Angeles (YYYYMMDDTHHMMSS). */
export function googleCalendarStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}${get("month")}${get("day")}T${hour}${get("minute")}${get("second")}`;
}

export function formatGoogleCalendarEvent(
  title: string,
  location: string,
  startDate: string,
  endDate: string,
) {
  const details =
    typeof window === "undefined" ? "" : `More details see: ${window.location.href}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    location,
    dates: `${googleCalendarStamp(startDate)}/${googleCalendarStamp(endDate)}`,
    ctz: PACIFIC,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
