-- RSVP reminders: 5 days before, 1 day before, and 3 hours before.
-- Replaces reminder_3d with reminder_5d.

alter table public.event_emails
  drop constraint if exists event_emails_kind_check;

update public.event_emails
set kind = 'reminder_5d'
where kind = 'reminder_3d';

alter table public.event_emails
  add constraint event_emails_kind_check
  check (
    kind in (
      'confirmation',
      'update',
      'reminder',
      'reminder_5d',
      'reminder_1d',
      'cancellation'
    )
  );

comment on table public.event_emails is
  'Audit log so RSVP/reminder emails are sent at most once per user+slot+kind. reminder = 3h, reminder_1d = day before, reminder_5d = 5 days before.';
