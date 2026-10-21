begin;
create function public.update_my_registration_number(reg_number text) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); staff_role text; staff_status text;
begin
 if uid is null then raise exception 'Sign in first' using errcode='42501'; end if;
 if reg_number is null or reg_number !~ '^[0-9]{1,64}$' then raise exception 'Registration number must contain numbers only'; end if;
 select role::text,status::text into staff_role,staff_status from public.staff_profiles where id=uid;
 if staff_role is not null and (staff_role<>'class_rep' or staff_status<>'active') then raise exception 'Student or active CR access required' using errcode='42501'; end if;
 if not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then raise exception 'Verify your email first' using errcode='42501'; end if;
 perform 1 from public.student_admissions where user_id=uid and status not in ('rejected','suspended') for update;
 if not found then raise exception 'Contact your class representative or administrator'; end if;
 update public.student_admissions set registration_number=reg_number where user_id=uid;
exception when unique_violation then raise exception 'This registration number is already registered. Sign in to your existing account or contact your administrator.' using errcode='23505';
end; $$;
revoke all on function public.update_my_registration_number(text) from public,anon;
grant execute on function public.update_my_registration_number(text) to authenticated;

create function public.admin_edit_student_registration(roster_id text,reg_number text,roster_patch jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare student public.monitored_students; uid uuid;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Verified administrator access required' using errcode='42501'; end if;
 if reg_number is null or reg_number !~ '^[0-9]{1,64}$' then raise exception 'Registration number must contain numbers only'; end if;
 select * into student from public.monitored_students where id=roster_id for update;
 if not found then raise exception 'Student record not found'; end if;
 uid:=student.profile_id;
 if uid is null then select id into uid from public.profiles where lower(email)=lower(student.email); end if;
 if uid is null then raise exception 'Student account not found'; end if;
 if exists(select 1 from public.staff_profiles where id=uid and role<>'class_rep') then raise exception 'Student account required'; end if;
 update public.student_admissions set registration_number=reg_number where user_id=uid;
 if not found then raise exception 'Student admission is unavailable'; end if;
 update public.monitored_students set name=coalesce(roster_patch->>'name',name),email=coalesce(roster_patch->>'email',email),
 stream_id=coalesce(roster_patch->>'stream_id',stream_id),year=coalesce((roster_patch->>'year')::integer,year)
 where id=roster_id returning * into student;
 return to_jsonb(student)||jsonb_build_object('registration_number',reg_number);
exception when unique_violation then raise exception 'This registration number is already registered. Sign in to your existing account or contact your administrator.' using errcode='23505';
end; $$;
revoke all on function public.admin_edit_student_registration(text,text,jsonb) from public,anon;
grant execute on function public.admin_edit_student_registration(text,text,jsonb) to authenticated;
commit;
