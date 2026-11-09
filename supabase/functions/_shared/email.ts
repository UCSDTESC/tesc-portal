export type EventEmailKind =
  | "confirmation"
  | "update"
  | "reminder"
  | "reminder_3d"
  | "reminder_1d";

export type EventEmailContext = {
  to: string;
  firstName: string;
  eventTitle: string;
  orgName: string;
  location: string;
  startsAt: string;
  endsAt: string;
  eventId: string;
  kind: EventEmailKind;
};

export type ReminderWindow = {
  kind: Extract<EventEmailKind, "reminder" | "reminder_3d" | "reminder_1d">;
  min: string;
  max: string;
};

const PACIFIC = "America/Los_Angeles";
const HOUR_MS = 60 * 60 * 1000;

function envOr(name: string, fallback: string) {
  const value = Deno.env.get(name);
  return value && value.trim() ? value.trim() : fallback;
}

export function appOrigin() {
  return envOr("APP_URL", "https://portal.tescatucsd.org").replace(/\/$/, "");
}

export function eventFromAddress() {
  return envOr("EVENT_EMAIL_FROM", "TESC Portal <events@tescatucsd.org>");
}

export function bulletinUrl(eventId: string) {
  return `${appOrigin()}/bulletin/${eventId}`;
}

export function formatPacific(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function calendarStamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}${get("month")}${get("day")}T${hour}${get("minute")}${get("second")}`;
}

export function googleCalendarUrl(ctx: EventEmailContext) {
  const start = calendarStamp(ctx.startsAt);
  const end = calendarStamp(ctx.endsAt);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ctx.eventTitle,
    location: ctx.location,
    details: `More details: ${bulletinUrl(ctx.eventId)}`,
    dates: `${start}/${end}`,
    ctz: PACIFIC,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function copyForKind(kind: EventEmailKind) {
  if (kind === "update") {
    return {
      subjectPrefix: "Updated time slot",
      heading: "Your event time was updated",
      intro: "You switched to a new time slot. Here are the updated details.",
    };
  }
  if (kind === "reminder_3d") {
    return {
      subjectPrefix: "Coming up in 3 days",
      heading: "Your event is in 3 days",
      intro: "This is a reminder that you are registered for an upcoming event.",
    };
  }
  if (kind === "reminder_1d") {
    return {
      subjectPrefix: "Tomorrow",
      heading: "Your event is tomorrow",
      intro: "This is a reminder that you are registered for an event tomorrow.",
    };
  }
  if (kind === "reminder") {
    return {
      subjectPrefix: "Starting in 3 hours",
      heading: "Your event starts in about 3 hours",
      intro: "This is a reminder that you are registered for an event today.",
    };
  }
  return {
    subjectPrefix: "You're registered",
    heading: "You're registered",
    intro: "Thanks for RSVPing. Here are your event details.",
  };
}

export function renderEventEmail(ctx: EventEmailContext) {
  const copy = copyForKind(ctx.kind);
  const when = `${formatPacific(ctx.startsAt)} – ${formatPacific(ctx.endsAt)}`;
  const link = bulletinUrl(ctx.eventId);
  const calendar = googleCalendarUrl(ctx);
  const greeting = ctx.firstName ? `Hi ${ctx.firstName},` : "Hi,";
  const subject = `${copy.subjectPrefix}: ${ctx.eventTitle}`;
  const location = ctx.location || "See bulletin for location";

  const text = [
    greeting,
    "",
    copy.intro,
    "",
    ctx.eventTitle,
    ctx.orgName,
    when,
    location,
    "",
    `Bulletin: ${link}`,
    `Add to Google Calendar: ${calendar}`,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,sans-serif;color:#262626;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
      <tr><td>
        <p style="margin:0 0 8px;color:#114675;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">TESC Portal</p>
        <h1 style="margin:0 0 16px;color:#114675;font-size:22px;">${escapeHtml(copy.heading)}</h1>
        <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
        <p style="margin:0 0 20px;">${escapeHtml(copy.intro)}</p>
        <p style="margin:0 0 4px;font-size:20px;font-weight:700;">${escapeHtml(ctx.eventTitle)}</p>
        <p style="margin:0 0 16px;color:#666;">${escapeHtml(ctx.orgName)}</p>
        <p style="margin:0 0 4px;"><strong>When:</strong> ${escapeHtml(when)}</p>
        <p style="margin:0 0 24px;"><strong>Where:</strong> ${escapeHtml(location)}</p>
        <p style="margin:0 0 12px;">
          <a href="${escapeAttr(link)}" style="display:inline-block;background:#3B7DB6;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;">View on the bulletin</a>
        </p>
        <p style="margin:0;">
          <a href="${escapeAttr(calendar)}" style="display:inline-block;background:#114675;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;">Add to Google Calendar</a>
        </p>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value);
}

export async function sendResendEmail(ctx: EventEmailContext) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const { subject, html, text } = renderEventEmail(ctx);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: eventFromAddress(),
      to: [ctx.to],
      subject,
      html,
      text,
    }),
  });

  const body = (await response.json()) as { id?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.message ?? `Resend ${response.status}`);
  }
  return body.id ?? null;
}

export function providedHookSecret(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();
  return (req.headers.get("x-webhook-secret") ?? "").trim();
}

export function hookAuthorized(req: Request) {
  const secret = Deno.env.get("EMAIL_HOOK_SECRET");
  if (!secret) return false;
  const provided = providedHookSecret(req);
  return Boolean(provided) && provided === secret;
}

/** Hourly cron windows (±30 minutes) around each reminder offset. */
export function reminderWindows(now = new Date()): ReminderWindow[] {
  return [
    windowAround(now, 72 * HOUR_MS, "reminder_3d"),
    windowAround(now, 24 * HOUR_MS, "reminder_1d"),
    windowAround(now, 3 * HOUR_MS, "reminder"),
  ];
}

function windowAround(
  now: Date,
  offsetMs: number,
  kind: ReminderWindow["kind"],
): ReminderWindow {
  const center = now.getTime() + offsetMs;
  return {
    kind,
    min: new Date(center - 0.5 * HOUR_MS).toISOString(),
    max: new Date(center + 0.5 * HOUR_MS).toISOString(),
  };
}

/** @deprecated Prefer reminderWindows(); kept for callers that expect a single 3h window. */
export function reminderWindow(now = new Date()) {
  const [threeHour] = reminderWindows(now).filter((window) => window.kind === "reminder");
  return { min: threeHour.min, max: threeHour.max };
}
