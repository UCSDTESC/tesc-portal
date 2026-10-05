-- Claiming an existing public.users row must update users.uuid first.
-- events_log / user_org_roles FKs pointed at users(uuid) with no ON UPDATE
-- CASCADE, so rewriting child rows to the new Auth id failed (that id was
-- not in public.users yet) and Google login bounced back logged out.

alter table public.events_log
  drop constraint if exists "Attendance_Log_user_id_fkey";

alter table public.events_log
  add constraint "Attendance_Log_user_id_fkey"
  foreign key (user_id) references public.users(uuid)
  on update cascade;

alter table public.user_org_roles
  drop constraint if exists user_org_roles_user_uuid_fkey;

alter table public.user_org_roles
  add constraint user_org_roles_user_uuid_fkey
  foreign key (user_uuid) references public.users(uuid)
  on update cascade;

drop function if exists public.finalize_user_signup();

create or replace function public.finalize_user_signup(p_resume_visible boolean default true)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_email
  from auth.users
  where id = v_uid;

  if v_email is null then
    raise exception 'Authenticated user email not found';
  end if;

  if exists (select 1 from public.users where uuid = v_uid) then
    update public.users
    set
      email = v_email,
      resume_visible = coalesce(public.users.resume_visible, coalesce(p_resume_visible, true))
    where uuid = v_uid;
    perform public.assign_company_recruiter_role_for_user(v_uid, v_email);
    return;
  end if;

  select uuid into v_existing
  from public.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_existing is not null then
    update public.users
    set
      uuid = v_uid,
      email = v_email,
      resume_visible = coalesce(public.users.resume_visible, coalesce(p_resume_visible, true))
    where uuid = v_existing;

    update public.event_emails
    set user_id = v_uid
    where user_id = v_existing;
  else
    insert into public.users (uuid, email, resume_visible)
    values (v_uid, v_email, coalesce(p_resume_visible, true));
  end if;

  perform public.assign_company_recruiter_role_for_user(v_uid, v_email);
end;
$$;

revoke all on function public.finalize_user_signup(boolean) from public, anon;
grant execute on function public.finalize_user_signup(boolean) to authenticated;
