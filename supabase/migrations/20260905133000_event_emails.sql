-- Idempotent send log for RSVP confirmations, slot updates, and 3-hour reminders.
-- Apply in the SQL editor or via `supabase db push`. Service role only (no RLS policies).

create table if not exists public.event_emails (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  event_id bigint not null,
  event_slot_id bigint not null,
  kind text not null check (kind in ('confirmation', 'update', 'reminder', 'cancellation')),
  sent_at timestamptz not null default now(),
  provider_id text,
  unique (user_id, event_id, event_slot_id, kind)
);

create index if not exists event_emails_slot_kind_idx
  on public.event_emails (event_slot_id, kind);

alter table public.event_emails enable row level security;

comment on table public.event_emails is
  'Audit log so RSVP/reminder emails are sent at most once per user+slot+kind.';
