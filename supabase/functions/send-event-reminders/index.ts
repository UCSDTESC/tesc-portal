import { reminderWindows, sendResendEmail } from "../_shared/email.ts";
import {
  authorizeHook,
  claimEmailSend,
  loadEventEmailRow,
  markEmailSent,
  releaseEmailClaim,
  serviceClient,
  type EmailKind,
} from "../_shared/supabase.ts";

type SlotRow = { id: number; event_id: number };
type LogRow = { user_id: string; event_id: number; event_slot_id: number };

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!(await authorizeHook(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windows = reminderWindows();
  const supabase = serviceClient();

  let sent = 0;
  let considered = 0;
  const failures: string[] = [];
  const windowResults: Array<{
    kind: EmailKind;
    min: string;
    max: string;
    slots: number;
    considered: number;
    sent: number;
  }> = [];

  for (const window of windows) {
    const { data: slots, error: slotError } = await supabase
      .from("event_slots")
      .select("id, event_id")
      .gte("starts_at", window.min)
      .lt("starts_at", window.max);
    if (slotError) {
      console.error(slotError.message);
      return Response.json({ error: slotError.message }, { status: 500 });
    }

    const upcoming = (slots ?? []) as SlotRow[];
    if (!upcoming.length) {
      windowResults.push({
        kind: window.kind,
        min: window.min,
        max: window.max,
        slots: 0,
        considered: 0,
        sent: 0,
      });
      continue;
    }

    const slotIds = upcoming.map((slot) => slot.id);
    const { data: logs, error: logError } = await supabase
      .from("events_log")
      .select("user_id, event_id, event_slot_id")
      .eq("attended", false)
      .in("event_slot_id", slotIds);
    if (logError) {
      console.error(logError.message);
      return Response.json({ error: logError.message }, { status: 500 });
    }

    const rows = (logs ?? []) as LogRow[];
    let windowSent = 0;
    considered += rows.length;

    for (const log of rows) {
      const row = await loadEventEmailRow(
        supabase,
        log.user_id,
        Number(log.event_id),
        Number(log.event_slot_id),
      );
      if (!row) continue;

      const claimed = await claimEmailSend(supabase, row, window.kind);
      if (!claimed) continue;

      try {
        const providerId = await sendResendEmail({
          to: row.to,
          firstName: row.firstName,
          eventTitle: row.eventTitle,
          orgName: row.orgName,
          location: row.location,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
          eventId: String(row.event_id),
          kind: window.kind,
        });
        await markEmailSent(supabase, row, window.kind, providerId);
        sent += 1;
        windowSent += 1;
      } catch (error) {
        await releaseEmailClaim(supabase, row, window.kind);
        const message = error instanceof Error ? error.message : "send failed";
        failures.push(`${window.kind} ${row.to}: ${message}`);
        console.error("send-event-reminders", message);
      }
    }

    windowResults.push({
      kind: window.kind,
      min: window.min,
      max: window.max,
      slots: upcoming.length,
      considered: rows.length,
      sent: windowSent,
    });
  }

  return Response.json({
    sent,
    considered,
    windows: windowResults,
    failures,
  });
});
