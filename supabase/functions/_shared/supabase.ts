import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { hookAuthorized, providedHookSecret } from "./email.ts";

export type EmailKind = "confirmation" | "update" | "reminder";

export type EventEmailRow = {
  user_id: string;
  event_id: number;
  event_slot_id: number;
  to: string;
  firstName: string;
  eventTitle: string;
  orgName: string;
  location: string;
  startsAt: string;
  endsAt: string;
};

type UserEmbed = { email?: string | null; first_name?: string | null };
type OrgEmbed = { name?: string | null };
type EventEmbed = {
  title?: string | null;
  location_str?: string | null;
  orgs?: OrgEmbed | OrgEmbed[] | null;
};

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function authorizeHook(req: Request) {
  if (hookAuthorized(req)) return true;
  const provided = providedHookSecret(req);
  if (!provided) return false;
  try {
    const supabase = serviceClient();
    const { data } = await supabase
      .from("email_runtime_config")
      .select("hook_secret")
      .eq("id", 1)
      .maybeSingle();
    return Boolean(data?.hook_secret && data.hook_secret === provided);
  } catch {
    return false;
  }
}

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function loadEventEmailRow(
  supabase: SupabaseClient,
  userId: string,
  eventId: number,
  slotId: number,
): Promise<EventEmailRow | null> {
  const [{ data: profile, error: userError }, { data: event, error: eventError }, { data: slot, error: slotError }] =
    await Promise.all([
      supabase.from("users").select("email, first_name").eq("uuid", userId).maybeSingle(),
      supabase.from("events").select("title, location_str, orgs(name)").eq("id", eventId).maybeSingle(),
      supabase.from("event_slots").select("starts_at, ends_at").eq("id", slotId).maybeSingle(),
    ]);

  if (userError) throw userError;
  if (eventError) throw eventError;
  if (slotError) throw slotError;
  if (!event || !slot) return null;

  let email = (profile as UserEmbed | null)?.email ?? "";
  let firstName = (profile as UserEmbed | null)?.first_name ?? "";
  if (!email) {
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    email = authData.user?.email ?? "";
    firstName = firstName || String(authData.user?.user_metadata?.first_name ?? "");
  }
  if (!email) return null;

  const org = asOne((event as EventEmbed).orgs);
  return {
    user_id: userId,
    event_id: eventId,
    event_slot_id: slotId,
    to: email,
    firstName,
    eventTitle: event.title ?? "TESC event",
    orgName: org?.name ?? "TESC",
    location: event.location_str ?? "",
    startsAt: slot.starts_at,
    endsAt: slot.ends_at,
  };
}

/** Insert the send-log row first. Returns false if this kind was already sent. */
export async function claimEmailSend(
  supabase: SupabaseClient,
  row: Pick<EventEmailRow, "user_id" | "event_id" | "event_slot_id">,
  kind: EmailKind,
) {
  const { error } = await supabase.from("event_emails").insert({
    user_id: row.user_id,
    event_id: row.event_id,
    event_slot_id: row.event_slot_id,
    kind,
  });
  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

export async function markEmailSent(
  supabase: SupabaseClient,
  row: Pick<EventEmailRow, "user_id" | "event_id" | "event_slot_id">,
  kind: EmailKind,
  providerId: string | null,
) {
  await supabase
    .from("event_emails")
    .update({ provider_id: providerId })
    .eq("user_id", row.user_id)
    .eq("event_id", row.event_id)
    .eq("event_slot_id", row.event_slot_id)
    .eq("kind", kind);
}

export async function releaseEmailClaim(
  supabase: SupabaseClient,
  row: Pick<EventEmailRow, "user_id" | "event_id" | "event_slot_id">,
  kind: EmailKind,
) {
  await supabase
    .from("event_emails")
    .delete()
    .eq("user_id", row.user_id)
    .eq("event_id", row.event_id)
    .eq("event_slot_id", row.event_slot_id)
    .eq("kind", kind)
    .is("provider_id", null);
}
