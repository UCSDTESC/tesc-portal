-- Optional Postgres hooks. Database Webhooks + a scheduled function in the
-- dashboard are equivalent and do not need this file.
--
-- Dashboard setup:
--   Webhook on public.events_log INSERT + UPDATE
--     POST https://<project>.supabase.co/functions/v1/send-rsvp-email
--     Header Authorization: Bearer <EMAIL_HOOK_SECRET>
--   Hourly schedule POST .../functions/v1/send-event-reminders
--     same Authorization header
--
-- This file (pg_net + pg_cron):
--   1. Enable extensions pg_net and pg_cron
--   2. Run the file
--   3. Update email_runtime_config with your functions URL and hook secret

create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists public.email_runtime_config (
  id int primary key default 1 check (id = 1),
  functions_url text not null default '',
  hook_secret text not null default ''
);

alter table public.email_runtime_config enable row level security;

insert into public.email_runtime_config (id)
values (1)
on conflict (id) do nothing;

-- Replace these two values after the first run.
update public.email_runtime_config
set
  functions_url = 'https://YOUR_PROJECT.supabase.co/functions/v1',
  hook_secret = 'REPLACE_WITH_EMAIL_HOOK_SECRET'
where id = 1;

create or replace function public.enqueue_rsvp_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.email_runtime_config%rowtype;
  kind text;
begin
  if new.attended is true or new.event_slot_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    kind := 'confirmation';
  elsif tg_op = 'UPDATE' and old.event_slot_id is distinct from new.event_slot_id then
    kind := 'update';
  else
    return new;
  end if;

  select * into cfg from public.email_runtime_config where id = 1;
  if cfg.functions_url is null or cfg.functions_url = '' or cfg.hook_secret is null or cfg.hook_secret = '' then
    return new;
  end if;

  begin
    perform net.http_post(
      url := rtrim(cfg.functions_url, '/') || '/send-rsvp-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || cfg.hook_secret
      ),
      body := jsonb_build_object(
        'type', tg_op,
        'table', tg_table_name,
        'record', to_jsonb(new),
        'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
        'kind', kind
      )
    );
  exception
    when others then
      raise warning 'enqueue_rsvp_email failed: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists events_log_enqueue_rsvp_email on public.events_log;
create trigger events_log_enqueue_rsvp_email
  after insert or update on public.events_log
  for each row
  execute procedure public.enqueue_rsvp_email();

do $$
declare
  existing_jobid bigint;
begin
  select jobid into existing_jobid from cron.job where jobname = 'send-event-reminders';
  if existing_jobid is not null then
    perform cron.unschedule(existing_jobid);
  end if;
end $$;

select cron.schedule(
  'send-event-reminders',
  '0 * * * *',
  $$
  select net.http_post(
    url := rtrim((select functions_url from public.email_runtime_config where id = 1), '/') || '/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select hook_secret from public.email_runtime_config where id = 1)
    ),
    body := '{}'::jsonb
  )
  where exists (
    select 1
    from public.email_runtime_config
    where id = 1
      and functions_url <> ''
      and hook_secret <> ''
  );
  $$
);
