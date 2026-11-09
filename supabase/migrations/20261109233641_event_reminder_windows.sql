-- RSVP reminders: 3 days before, 1 day before, and 3 hours before.
-- Existing kind "reminder" continues to mean the 3-hour window.

alter table public.event_emails
  drop constraint if exists event_emails_kind_check;

alter table public.event_emails
  add constraint event_emails_kind_check
  check (
    kind in (
      'confirmation',
      'update',
      'reminder',
      'reminder_3d',
      'reminder_1d',
      'cancellation'
    )
  );

comment on table public.event_emails is
  'Audit log so RSVP/reminder emails are sent at most once per user+slot+kind. reminder = 3h, reminder_1d = day before, reminder_3d = 3 days before.';
