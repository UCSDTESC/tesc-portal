-- Posted-events RSVP and attendance counters are columns on public.events.
-- Realtime needs this table in the publication so the admin table can
-- hear UPDATEs. SELECT policies already allow those rows to be read.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;
