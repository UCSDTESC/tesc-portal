-- If Auth creates a new uuid for an email that already has a public.users
-- row (imported / legacy profiles), skip insert and attach that row to
-- auth.uid() so Google and password login keep the existing profile.

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
    update public.events_log
    set user_id = v_uid
    where user_id = v_existing;

    update public.user_org_roles
    set user_uuid = v_uid
    where user_uuid = v_existing;

    update public.event_emails
    set user_id = v_uid
    where user_id = v_existing;

    update public.users
    set
      uuid = v_uid,
      email = v_email,
      resume_visible = coalesce(public.users.resume_visible, coalesce(p_resume_visible, true))
    where uuid = v_existing;
  else
    insert into public.users (uuid, email, resume_visible)
    values (v_uid, v_email, coalesce(p_resume_visible, true));
  end if;

  perform public.assign_company_recruiter_role_for_user(v_uid, v_email);
end;
$$;

create or replace function public.finalize_user_signup()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform public.finalize_user_signup(true);
end;
$$;

revoke all on function public.finalize_user_signup(boolean) from public, anon;
revoke all on function public.finalize_user_signup() from public, anon;
grant execute on function public.finalize_user_signup(boolean) to authenticated;
grant execute on function public.finalize_user_signup() to authenticated;
