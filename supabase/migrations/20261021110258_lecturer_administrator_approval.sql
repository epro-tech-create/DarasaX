begin;
create table private.lecturer_applications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);
alter table private.lecturer_applications enable row level security;
revoke all on private.lecturer_applications from public,anon,authenticated;

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
    if membership.role='lecturer' and (membership.status='active' or exists(select 1 from private.lecturer_applications where user_id=uid)) then return; end if;
    raise exception 'This account cannot register as a lecturer.' using errcode='42501';
  end if;
  if not exists(select 1 from auth.identities where user_id=uid and provider='email') or coalesce(person.encrypted_password,'')='' then
    raise exception 'Create a lecturer account using email and password.' using errcode='42501';
  end if;
  if exists(select 1 from public.student_admissions where user_id=uid and (registration_number is not null or submitted_at is not null or status <> 'pending'))
     or exists(select 1 from public.profiles where id=uid and onboarding_completed) then
    raise exception 'This student account cannot register as a lecturer.' using errcode='42501';
  end if;
  -- Reserve the identity, but grant no staff privileges until an administrator approves.
  insert into public.staff_profiles(id,role,email,full_name,status,onboarding_completed)
  values(uid,'lecturer',person.email,left(coalesce(person.raw_user_meta_data->>'full_name','Lecturer'),200),'inactive',false);
  insert into private.lecturer_applications(user_id) values(uid);
end; $$;

create function private.lecturer_application_status() returns jsonb
language sql stable security definer set search_path=''
as $$ select coalesce((select jsonb_build_object('status',case when s.status='active' then 'approved' else a.status end)
 from private.lecturer_applications a join public.staff_profiles s on s.id=a.user_id and s.role='lecturer' where a.user_id=auth.uid()),'null'::jsonb); $$;
revoke all on function private.lecturer_application_status() from public,anon;
grant execute on function private.lecturer_application_status() to authenticated;
create function public.lecturer_application_status() returns jsonb language sql security invoker set search_path=''
as $$ select private.lecturer_application_status(); $$;
revoke all on function public.lecturer_application_status() from public,anon;
grant execute on function public.lecturer_application_status() to authenticated;

create function private.list_lecturer_applications() returns jsonb
language plpgsql stable security definer set search_path=''
as $$ begin
 if not public.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('user_id',s.id,'name',s.full_name,'email',s.email,
   'status',case when s.status='active' then 'approved' else coalesce(a.status,'inactive') end,
   'submitted_at',coalesce(a.submitted_at,s.created_at),'verified_at',u.email_confirmed_at)
   order by coalesce(a.status,'approved')='pending' desc,coalesce(a.submitted_at,s.created_at) desc)
 from public.staff_profiles s join auth.users u on u.id=s.id left join private.lecturer_applications a on a.user_id=s.id where s.role='lecturer'),'[]'::jsonb);
end; $$;
revoke all on function private.list_lecturer_applications() from public,anon;
grant execute on function private.list_lecturer_applications() to authenticated;
create function public.list_lecturer_applications() returns jsonb language sql security invoker set search_path=''
as $$ select private.list_lecturer_applications(); $$;
revoke all on function public.list_lecturer_applications() from public,anon;
grant execute on function public.list_lecturer_applications() to authenticated;

create function private.review_lecturer_application(applicant_id uuid,decision text) returns void
language plpgsql security definer set search_path=''
as $$ declare application private.lecturer_applications;
begin
 if not public.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if decision not in ('approve','reject') or decision is null then raise exception 'Invalid decision'; end if;
 select * into application from private.lecturer_applications where user_id=applicant_id for update;
 if not found or application.status<>'pending' then raise exception 'This application has already been reviewed or does not exist'; end if;
 if not exists(select 1 from auth.users where id=applicant_id and email_confirmed_at is not null)
    or not exists(select 1 from public.staff_profiles where id=applicant_id and role='lecturer' and status='inactive') then
   raise exception 'A verified lecturer application is required';
 end if;
 update private.lecturer_applications set status=case when decision='approve' then 'approved' else 'rejected' end,reviewed_by=auth.uid(),reviewed_at=now() where user_id=applicant_id;
 if decision='approve' then update public.staff_profiles set status='active' where id=applicant_id and role='lecturer'; end if;
 insert into public.audit_log(actor,role,action,summary,detail,actor_id)
 select coalesce(full_name,'Administrator'),'admin','update',case when decision='approve' then 'Lecturer approved' else 'Lecturer application rejected' end,applicant_id::text,auth.uid() from public.staff_profiles where id=auth.uid();
end; $$;
revoke all on function private.review_lecturer_application(uuid,text) from public,anon;
grant execute on function private.review_lecturer_application(uuid,text) to authenticated;
create function public.review_lecturer_application(applicant_id uuid,decision text) returns void language sql security invoker set search_path=''
as $$ select private.review_lecturer_application(applicant_id,decision); $$;
revoke all on function public.review_lecturer_application(uuid,text) from public,anon;
grant execute on function public.review_lecturer_application(uuid,text) to authenticated;
commit;
