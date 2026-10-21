begin;
create schema if not exists private;
grant usage on schema private to authenticated;

-- Run this guard as its caller: only privileged, validated routines may create
-- lecturer membership or set initial teaching scope. Direct browser writes stay blocked.
create or replace function public.guard_staff_membership()
returns trigger language plpgsql security invoker set search_path = ''
as $$ begin
  if current_user in ('authenticated','anon') and not public.is_admin() then
    if tg_op = 'INSERT' then raise exception 'Administrator appointment required'; end if;
    if new.role is distinct from old.role or new.status is distinct from old.status
      or new.stream_id is distinct from old.stream_id
      or new.stream_ids is distinct from old.stream_ids
      or new.module_ids is distinct from old.module_ids then
      raise exception 'Administrator approval required for staff access changes';
    end if;
  end if;
  return new;
end; $$;

create or replace function private.complete_lecturer_registration()
returns void language plpgsql security definer set search_path = ''
as $$ declare uid uuid := auth.uid(); person auth.users; membership public.staff_profiles;
begin
  if uid is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select * into person from auth.users where id=uid for update;
  if person.email_confirmed_at is null or person.email is null then
    raise exception 'Please verify your email before signing in.' using errcode='42501';
  end if;
  select * into membership from public.staff_profiles where id=uid;
  if found then
    if membership.role <> 'lecturer' or membership.status <> 'active' then
      raise exception 'This account cannot register as a lecturer.' using errcode='42501';
    end if;
    return;
  end if;
  if not exists(select 1 from auth.identities where user_id=uid and provider='email')
     or coalesce(person.encrypted_password,'')='' then
    raise exception 'Create a lecturer account using email and password.' using errcode='42501';
  end if;
  if exists(select 1 from public.student_admissions where user_id=uid
       and (registration_number is not null or submitted_at is not null or status <> 'pending'))
     or exists(select 1 from public.profiles where id=uid and onboarding_completed) then
    raise exception 'This student account cannot register as a lecturer.' using errcode='42501';
  end if;
  insert into public.staff_profiles(id,role,email,full_name,status,onboarding_completed)
  values(uid,'lecturer',person.email,left(coalesce(person.raw_user_meta_data->>'full_name','Lecturer'),200),'active',false);
end; $$;
revoke all on function private.complete_lecturer_registration() from public,anon;
grant execute on function private.complete_lecturer_registration() to authenticated;
create or replace function public.complete_lecturer_registration()
returns void language sql security invoker set search_path = ''
as $$ select private.complete_lecturer_registration(); $$;
revoke all on function public.complete_lecturer_registration() from public,anon;
grant execute on function public.complete_lecturer_registration() to authenticated;

create or replace function private.complete_lecturer_setup(selected_classes text[],selected_modules text[])
returns void language plpgsql security definer set search_path = ''
as $$ declare membership public.staff_profiles;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  select * into membership from public.staff_profiles where id=auth.uid() for update;
  if not found or membership.role <> 'lecturer' or membership.status <> 'active'
     or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then
    raise exception 'Active verified lecturer access required' using errcode='42501';
  end if;
  if membership.onboarding_completed then raise exception 'Teaching setup already completed. Contact your administrator to change it.'; end if;
  if coalesce(cardinality(selected_classes),0) not between 1 and 20
     or exists(select 1 from unnest(selected_classes) c where c is null or not exists(select 1 from public.academic_classes a where a.id=c and not a.archived)) then
    raise exception 'Select valid classes.';
  end if;
  if coalesce(cardinality(selected_modules),0) not between 1 and 11
     or exists(select 1 from unnest(selected_modules) m where m is null or m <> all(array['mod-numerical','mod-sensor-networks','mod-cyber','mod-db-admin','mod-web','mod-dsa','mod-se','mod-dsp','mod-electrical','mod-hci','mod-electronics'])) then
    raise exception 'Select valid modules.';
  end if;
  update public.staff_profiles set stream_ids=selected_classes,stream_id=selected_classes[1],module_ids=selected_modules,onboarding_completed=true where id=auth.uid();
end; $$;
revoke all on function private.complete_lecturer_setup(text[],text[]) from public,anon;
grant execute on function private.complete_lecturer_setup(text[],text[]) to authenticated;
create or replace function public.complete_lecturer_setup(selected_classes text[],selected_modules text[])
returns void language sql security invoker set search_path = ''
as $$ select private.complete_lecturer_setup(selected_classes,selected_modules); $$;
revoke all on function public.complete_lecturer_setup(text[],text[]) from public,anon;
grant execute on function public.complete_lecturer_setup(text[],text[]) to authenticated;
commit;
