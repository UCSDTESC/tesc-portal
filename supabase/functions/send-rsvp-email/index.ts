import { sendResendEmail } from "../_shared/email.ts";
import {
  authorizeHook,
  claimEmailSend,
  loadEventEmailRow,
  markEmailSent,
  releaseEmailClaim,
  serviceClient,
  type EmailKind,
} from "../_shared/supabase.ts";

type WebhookBody = {
  type?: string;
  kind?: EmailKind;
  record?: {
    user_id?: string;
    event_id?: number | string;
    event_slot_id?: number | string | null;
    attended?: boolean;
  };
  old_record?: {
    event_slot_id?: number | string | null;
    attended?: boolean;
  } | null;
};

function resolveKind(body: WebhookBody): EmailKind | null {
  if (body.kind === "confirmation" || body.kind === "update" || body.kind === "reminder") {
    return body.kind;
  }
  const record = body.record;
  if (!record || record.attended || record.event_slot_id == null) return null;

  const type = (body.type ?? "INSERT").toUpperCase();
  if (type === "INSERT") return "confirmation";
  if (type === "UPDATE") {
    const before = body.old_record?.event_slot_id;
    const after = record.event_slot_id;
    if (before != null && after != null && String(before) !== String(after)) return "update";
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!(await authorizeHook(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = resolveKind(body);
  const record = body.record;
  if (!kind || !record?.user_id || record.event_id == null || record.event_slot_id == null) {
    return Response.json({ skipped: true });
  }

  const eventId = Number(record.event_id);
  const slotId = Number(record.event_slot_id);
  if (!Number.isFinite(eventId) || !Number.isFinite(slotId)) {
    return Response.json({ skipped: true });
  }

  const supabase = serviceClient();
  const row = await loadEventEmailRow(supabase, record.user_id, eventId, slotId);
  if (!row) return Response.json({ skipped: true, reason: "missing-context" });

  const claimed = await claimEmailSend(supabase, row, kind);
  if (!claimed) return Response.json({ skipped: true, reason: "already-sent" });

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
      kind,
    });
    await markEmailSent(supabase, row, kind, providerId);
    return Response.json({ sent: true, kind, providerId });
  } catch (error) {
    await releaseEmailClaim(supabase, row, kind);
    const message = error instanceof Error ? error.message : "send failed";
    console.error("send-rsvp-email", message);
    return Response.json({ error: message }, { status: 500 });
  }
});
