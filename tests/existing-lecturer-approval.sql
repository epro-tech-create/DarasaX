-- Run against the isolated security fixture after the supporting migrations.
begin;
insert into auth.users(id,email,encrypted_password,email_confirmed_at,raw_user_meta_data) values('00000000-0000-4000-8000-000000000909','existing@example.invalid','fixture',now(),'{}');
insert into public.staff_profiles(id,role,status,onboarding_completed,stream_ids,module_ids) values('00000000-0000-4000-8000-000000000909','lecturer','active',true,array['BENG24COE-1'],array['mod-web']);
update public.profiles set class_name='BENG24COE-1',institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,onboarding_completed=true where id='00000000-0000-4000-8000-000000000909';
update public.student_admissions set status='approved' where user_id='00000000-0000-4000-8000-000000000909';
-- Require administrator approval for the existing active lecturer cohort.

lock table public.staff_profiles in share row exclusive mode;
do $$ begin
 if (select count(*) from public.staff_profiles where role='lecturer' and status='active') <> 1 then
   raise exception 'Expected exactly one existing active lecturer; review changed membership before applying';
 end if;
end; $$;
insert into private.lecturer_applications(user_id,status)
select id,'pending' from public.staff_profiles where role='lecturer' and status='active'
on conflict(user_id) do update set status='pending',submitted_at=now(),reviewed_by=null,reviewed_at=null;
update public.staff_profiles set status='inactive' where role='lecturer' and status='active';
create or replace function public.active_student_stream() returns text language sql stable security definer set search_path=''
as $$ select p.class_name from public.profiles p
 join public.student_admissions a on a.user_id=p.id and a.status='approved'
 join public.academic_classes c on c.id=p.class_name and not c.archived
 where p.id=auth.uid() and p.onboarding_completed and p.institution='Dar es Salaam Institute of Technology (DIT)'
 and p.programme='BENG24COE' and p.year_of_study=3 and p.semester=1
 and c.institution=p.institution and c.programme=p.programme and c.year=p.year_of_study and c.semester=p.semester
 and not exists(select 1 from public.staff_profiles where id=auth.uid() and role='lecturer' and status<>'active') and (not exists(select 1 from public.staff_profiles where id=auth.uid() and role='admin') or private.admin_step_up_allowed()); $$;



set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000909","role":"authenticated"}',true);
do $$ begin
 if public.is_staff() or public.active_student_stream() is not null or public.staff_material_scope('BENG24COE-1','mod-web') then raise exception 'Pending lecturer retains access'; end if;
 if public.lecturer_application_status()->>'status'<>'pending' then raise exception 'Application missing'; end if;
end; $$;
reset role;
do $$ begin
 if not exists(select 1 from public.staff_profiles where id='00000000-0000-4000-8000-000000000909' and status='inactive' and onboarding_completed and stream_ids=array['BENG24COE-1'] and module_ids=array['mod-web']) then raise exception 'Existing teaching setup lost'; end if;
end; $$;
rollback;