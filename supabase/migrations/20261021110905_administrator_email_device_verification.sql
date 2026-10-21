begin;
create table private.admin_security_policy(id boolean primary key default true check(id),enabled boolean not null default false);
insert into private.admin_security_policy(id,enabled) values(true,false);
create table private.admin_verified_sessions(
 session_id uuid primary key references auth.sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 verified_at timestamptz not null default now(),expires_at timestamptz not null
);
create table private.admin_trusted_browsers(
 token_hash text primary key,user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),expires_at timestamptz not null
);
create index admin_trusted_browsers_user_idx on private.admin_trusted_browsers(user_id);
create table private.admin_email_challenges(
 user_id uuid primary key references auth.users(id) on delete cascade,
 token_hash text not null,password_session_id uuid not null,
 created_at timestamptz not null default now(),expires_at timestamptz not null,
 last_sent_at timestamptz not null default now(),attempts integer not null default 0
);
alter table private.admin_security_policy enable row level security;
alter table private.admin_verified_sessions enable row level security;
alter table private.admin_trusted_browsers enable row level security;
alter table private.admin_email_challenges enable row level security;
revoke all on private.admin_security_policy,private.admin_verified_sessions,private.admin_trusted_browsers,private.admin_email_challenges from public,anon,authenticated;

create function private.admin_session_verified() returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from private.admin_verified_sessions v join auth.sessions s on s.id=v.session_id and s.user_id=v.user_id
 where v.user_id=auth.uid() and v.session_id=(auth.jwt()->>'session_id')::uuid and v.expires_at>now() and (s.not_after is null or s.not_after>now())
 and exists(select 1 from public.staff_profiles where id=auth.uid() and role='admin' and status='active')); $$;
revoke all on function private.admin_session_verified() from public,anon;
grant execute on function private.admin_session_verified() to authenticated;

-- Called only from administrator branches of the existing authorization helpers.
create function private.admin_step_up_allowed() returns boolean language sql stable security definer set search_path=''
as $$ select not coalesce((select enabled from private.admin_security_policy where id),false) or private.admin_session_verified(); $$;
revoke all on function private.admin_step_up_allowed() from public,anon,authenticated;

create function public.admin_email_verified() returns boolean language sql stable security invoker set search_path=''
as $$ select private.admin_session_verified(); $$;
revoke all on function public.admin_email_verified() from public,anon;
grant execute on function public.admin_email_verified() to authenticated;

create function private.start_admin_email_check(challenge_token text,browser_token text) returns jsonb
language plpgsql security definer set search_path=''
as $$ declare uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid; pending private.admin_email_challenges; pwd_time timestamptz;
begin
 if not exists(select 1 from public.staff_profiles where id=uid and role='admin' and status='active') then raise exception 'Administrator access required' using errcode='42501'; end if;
 if private.admin_session_verified() then return jsonb_build_object('verified',true); end if;
 select max(to_timestamp((e->>'timestamp')::double precision)) into pwd_time from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) e where e->>'method'='password';
 if pwd_time is null or pwd_time<now()-interval '5 minutes' or pwd_time>now()+interval '1 minute'
    or not exists(select 1 from auth.sessions where id=sid and user_id=uid and (not_after is null or not_after>now())) then
   return jsonb_build_object('error','Please sign in with your password again.','restart',true);
 end if;
 if length(coalesce(browser_token,''))=64 and exists(select 1 from private.admin_trusted_browsers where user_id=uid and token_hash=encode(extensions.digest(browser_token,'sha256'),'hex') and expires_at>now()) then
   insert into private.admin_verified_sessions(session_id,user_id,expires_at) values(sid,uid,now()+interval '12 hours') on conflict(session_id) do update set verified_at=now(),expires_at=excluded.expires_at;
   return jsonb_build_object('verified',true);
 end if;
 if challenge_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid challenge'; end if;
 -- Serialize send attempts per account, including simultaneous requests from different browsers.
 perform 1 from auth.users where id=uid and email_confirmed_at is not null for update;
 if not found then raise exception 'A verified administrator email is required'; end if;
 select * into pending from private.admin_email_challenges where user_id=uid;
 if found and pending.expires_at>now() then
   if pending.attempts>=5 then return jsonb_build_object('error','Too many attempts. Wait ten minutes and sign in again.'); end if;
   if pending.last_sent_at>now()-interval '60 seconds' then return jsonb_build_object('error','Please wait 60 seconds before requesting another code.'); end if;
   update private.admin_email_challenges set token_hash=encode(extensions.digest(challenge_token,'sha256'),'hex'),password_session_id=sid,last_sent_at=now() where user_id=uid;
 else
   insert into private.admin_email_challenges(user_id,token_hash,password_session_id,expires_at)
   values(uid,encode(extensions.digest(challenge_token,'sha256'),'hex'),sid,now()+interval '10 minutes')
   on conflict(user_id) do update set token_hash=excluded.token_hash,password_session_id=sid,created_at=now(),expires_at=excluded.expires_at,last_sent_at=now(),attempts=0;
 end if;
 delete from private.admin_trusted_browsers where user_id=uid and expires_at<=now();
 return jsonb_build_object('verified',false,'sent',true);
end; $$;
revoke all on function private.start_admin_email_check(text,text) from public,anon;
grant execute on function private.start_admin_email_check(text,text) to authenticated;
create function public.start_admin_email_check(challenge_token text,browser_token text default '') returns jsonb language sql security invoker set search_path=''
as $$ select private.start_admin_email_check(challenge_token,browser_token); $$;
revoke all on function public.start_admin_email_check(text,text) from public,anon;
grant execute on function public.start_admin_email_check(text,text) to authenticated;

create function private.admin_email_attempt(challenge_token text) returns boolean
language plpgsql security definer set search_path=''
as $$ begin
 if not exists(select 1 from public.staff_profiles where id=auth.uid() and role='admin' and status='active') then return false; end if;
 update private.admin_email_challenges set attempts=attempts+1 where user_id=auth.uid() and token_hash=encode(extensions.digest(challenge_token,'sha256'),'hex') and expires_at>now() and attempts<5;
 return found;
end; $$;
revoke all on function private.admin_email_attempt(text) from public,anon;
grant execute on function private.admin_email_attempt(text) to authenticated;
create function public.admin_email_attempt(challenge_token text) returns boolean language sql security invoker set search_path=''
as $$ select private.admin_email_attempt(challenge_token); $$;
revoke all on function public.admin_email_attempt(text) from public,anon;
grant execute on function public.admin_email_attempt(text) to authenticated;

create function private.finish_admin_email_check(challenge_token text,browser_token text) returns void
language plpgsql security definer set search_path=''
as $$ declare pending private.admin_email_challenges; sid uuid:=(auth.jwt()->>'session_id')::uuid; otp_time timestamptz;
begin
 if not exists(select 1 from public.staff_profiles where id=auth.uid() and role='admin' and status='active') then raise exception 'Administrator access required' using errcode='42501'; end if;
 select * into pending from private.admin_email_challenges where user_id=auth.uid() and token_hash=encode(extensions.digest(challenge_token,'sha256'),'hex') for update;
 if not found or pending.expires_at<=now() or pending.attempts not between 1 and 5 then raise exception 'Verification expired. Sign in again.' using errcode='42501'; end if;
 select max(to_timestamp((e->>'timestamp')::double precision)) into otp_time from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) e where e->>'method' in ('otp','magiclink');
 if otp_time is null or otp_time<pending.created_at-interval '1 second' or otp_time<now()-interval '5 minutes' or otp_time>now()+interval '1 minute'
   or not exists(select 1 from auth.sessions where id=sid and user_id=auth.uid() and (not_after is null or not_after>now()))
   -- The password proof was checked when the challenge was created. Email OTP
   -- can replace that Auth session when single-session enforcement is enabled.
   -- OTP must be email: phone identities cannot use this email-only flow.
   or exists(select 1 from auth.users where id=auth.uid() and nullif(phone,'') is not null)
 then raise exception 'Email verification required' using errcode='42501'; end if;
 insert into private.admin_verified_sessions(session_id,user_id,expires_at) values(sid,auth.uid(),now()+interval '12 hours') on conflict(session_id) do update set verified_at=now(),expires_at=excluded.expires_at;
 if coalesce(browser_token,'')<>'' then
   if browser_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid browser token'; end if;
   insert into private.admin_trusted_browsers(token_hash,user_id,expires_at) values(encode(extensions.digest(browser_token,'sha256'),'hex'),auth.uid(),now()+interval '30 days');
 end if;
 delete from private.admin_email_challenges where user_id=auth.uid();
end; $$;
revoke all on function private.finish_admin_email_check(text,text) from public,anon;
grant execute on function private.finish_admin_email_check(text,text) to authenticated;
create function public.finish_admin_email_check(challenge_token text,browser_token text default '') returns void language sql security invoker set search_path=''
as $$ select private.finish_admin_email_check(challenge_token,browser_token); $$;
revoke all on function public.finish_admin_email_check(text,text) from public,anon;
grant execute on function public.finish_admin_email_check(text,text) to authenticated;

create function private.forget_admin_browser(browser_token text) returns void language plpgsql security definer set search_path=''
as $$ begin
 delete from private.admin_trusted_browsers where user_id=auth.uid() and token_hash=encode(extensions.digest(browser_token,'sha256'),'hex');
 delete from private.admin_verified_sessions where user_id=auth.uid() and session_id=(auth.jwt()->>'session_id')::uuid;
end; $$;
revoke all on function private.forget_admin_browser(text) from public,anon;
grant execute on function private.forget_admin_browser(text) to authenticated;
create function public.forget_admin_browser(browser_token text) returns void language sql security invoker set search_path=''
as $$ select private.forget_admin_browser(browser_token); $$;
revoke all on function public.forget_admin_browser(text) from public,anon;
grant execute on function public.forget_admin_browser(text) to authenticated;

-- Administrator-only guards. No RLS policies, Storage policies, API hooks or
-- authenticator-role settings are changed. Other staff roles retain their scope.
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.staff_profiles where id=auth.uid() and role='admin' and status='active') and private.admin_step_up_allowed(); $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.staff_profiles where id=auth.uid() and status='active' and (role<>'admin' or private.admin_step_up_allowed())); $$;
create or replace function public.my_staff_role() returns text language sql stable security definer set search_path=''
as $$ select role::text from public.staff_profiles where id=auth.uid() and status='active' and (role<>'admin' or private.admin_step_up_allowed()); $$;
create or replace function public.my_stream() returns text language sql stable security definer set search_path=''
as $$ select stream_id from public.staff_profiles where id=auth.uid() and status='active' and (role<>'admin' or private.admin_step_up_allowed()); $$;
create or replace function public.my_stream_ids() returns text[] language sql stable security definer set search_path=''
as $$ select case when role='class_rep' then array[stream_id] else stream_ids end from public.staff_profiles where id=auth.uid() and status='active' and (role<>'admin' or private.admin_step_up_allowed()); $$;
create or replace function public.my_module_ids() returns text[] language sql stable security definer set search_path=''
as $$ select module_ids from public.staff_profiles where id=auth.uid() and status='active' and (role<>'admin' or private.admin_step_up_allowed()); $$;

create or replace function public.staff_material_scope(target_stream text,target_module text default null) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.staff_profiles s where s.id=auth.uid() and s.status='active'
 and ((s.role='admin' and public.is_admin()) or (s.role='class_rep' and s.stream_id=target_stream)
 or (s.role='lecturer' and target_stream=any(s.stream_ids) and (target_module is null or target_module=any(s.module_ids))))); $$;
create or replace function public.staff_topic_scope(target_module text) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.staff_profiles where id=auth.uid() and status='active'
 and ((role='admin' and public.is_admin()) or role='class_rep' or (role='lecturer' and target_module=any(module_ids)))); $$;
create or replace function public.can_review_student(target uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and exists(select 1 from public.staff_profiles s join public.profiles p on p.id=target
 where s.id=auth.uid() and s.status='active' and ((s.role='admin' and public.is_admin()) or (s.role='class_rep' and s.stream_id=p.class_name))); $$;

create or replace function public.active_student_stream() returns text language sql stable security definer set search_path=''
as $$ select p.class_name from public.profiles p
 join public.student_admissions a on a.user_id=p.id and a.status='approved'
 join public.academic_classes c on c.id=p.class_name and not c.archived
 where p.id=auth.uid() and p.onboarding_completed and p.institution='Dar es Salaam Institute of Technology (DIT)'
 and p.programme='BENG24COE' and p.year_of_study=3 and p.semester=1
 and c.institution=p.institution and c.programme=p.programme and c.year=p.year_of_study and c.semester=p.semester
 and (not exists(select 1 from public.staff_profiles where id=auth.uid() and role='admin') or private.admin_step_up_allowed()); $$;

-- These existing privileged RPCs inspected membership directly, so add the
-- same administrator check rather than installing a project-wide request hook.
create or replace function public.add_academic_class(class_id text,class_label text,class_institution text,class_programme text,class_year integer,class_semester integer,evening boolean default false)
returns void language plpgsql security definer set search_path=''
as $$ begin
 if not public.is_admin() then raise exception 'Administrator email verification required' using errcode='42501'; end if;
 insert into public.academic_classes(id,label,institution,programme,year,semester,is_evening,created_by)
 values(upper(trim(class_id)),trim(class_label),trim(class_institution),upper(trim(class_programme)),class_year,class_semester,evening,auth.uid());
end; $$;
create or replace function public.archive_academic_class(class_id text) returns void
language plpgsql security definer set search_path=''
as $$ begin
 if not public.is_admin() then raise exception 'Administrator email verification required' using errcode='42501'; end if;
 update public.academic_classes set archived=true where id=class_id;
end; $$;
create or replace function public.list_staff_students() returns jsonb
language plpgsql stable security definer set search_path=''
as $$ declare staff public.staff_profiles;
begin
 select * into staff from public.staff_profiles where id=auth.uid() and status='active' and role in ('admin','class_rep','lecturer');
 if not found then raise exception 'Active staff access required' using errcode='42501'; end if;
 if staff.role='admin' and not public.is_admin() then raise exception 'Administrator email verification required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('registration_number',a.registration_number,'admission_status',a.status) order by m.name,m.id)
 from public.monitored_students m left join public.student_admissions a on a.user_id=m.profile_id
 where staff.role='admin' or (staff.role='class_rep' and m.stream_id=staff.stream_id)
 or (staff.role='lecturer' and (m.stream_id=any(staff.stream_ids) or (cardinality(staff.stream_ids)=0 and m.stream_id=staff.stream_id)))),'[]'::jsonb);
end; $$;
-- Enable administrator enforcement only after the new UI is deployed.
commit;
