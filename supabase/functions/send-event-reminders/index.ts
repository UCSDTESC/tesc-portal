import { reminderWindow, sendResendEmail } from "../_shared/email.ts";
import {
  authorizeHook,
  claimEmailSend,
  loadEventEmailRow,
  markEmailSent,
  releaseEmailClaim,
  serviceClient,
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

  const { min, max } = reminderWindow();
  const supabase = serviceClient();

  const { data: slots, error: slotError } = await supabase
    .from("event_slots")
    .select("id, event_id")
    .gte("starts_at", min)
    .lt("starts_at", max);
  if (slotError) {
    console.error(slotError.message);
    return Response.json({ error: slotError.message }, { status: 500 });
  }

  const upcoming = (slots ?? []) as SlotRow[];
  if (!upcoming.length) return Response.json({ sent: 0, considered: 0 });

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

  let sent = 0;
  const failures: string[] = [];

  for (const log of (logs ?? []) as LogRow[]) {
    const row = await loadEventEmailRow(supabase, log.user_id, Number(log.event_id), Number(log.event_slot_id));
    if (!row) continue;

    const claimed = await claimEmailSend(supabase, row, "reminder");
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
        kind: "reminder",
      });
      await markEmailSent(supabase, row, "reminder", providerId);
      sent += 1;
    } catch (error) {
      await releaseEmailClaim(supabase, row, "reminder");
      const message = error instanceof Error ? error.message : "send failed";
      failures.push(`${row.to}: ${message}`);
      console.error("send-event-reminders", message);
    }
  }

  return Response.json({
    sent,
    considered: (logs ?? []).length,
    window: { min, max },
    failures,
  });
});
