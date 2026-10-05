-- Food description and AS funding flags for event submissions.
alter table public.events
  add column if not exists food_provided text,
  add column if not exists as_funding boolean not null default false;

comment on column public.events.food_provided is
  'Description of food provided at the event.';

comment on column public.events.as_funding is
  'Whether Associated Students (AS) funding will be used.';
