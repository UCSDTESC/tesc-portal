-- Google sign-in fires INITIAL_SESSION and SIGNED_IN together, and each one
-- calls this. Without a lock, both miss public.users and the second insert
-- hits Users_Email_key.

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
  v_attempt integer;
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

  perform pg_advisory_xact_lock(hashtextextended(lower(v_email), 0));

  for v_attempt in 1..2 loop
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

      perform public.assign_company_recruiter_role_for_user(v_uid, v_email);
      return;
    end if;

    begin
      insert into public.users (uuid, email, resume_visible)
      values (v_uid, v_email, coalesce(p_resume_visible, true));
      perform public.assign_company_recruiter_role_for_user(v_uid, v_email);
      return;
    exception
      when unique_violation then
        if v_attempt = 2 then
          raise;
        end if;
    end;
  end loop;
end;
$$;

revoke all on function public.finalize_user_signup(boolean) from public, anon;
grant execute on function public.finalize_user_signup(boolean) to authenticated;
