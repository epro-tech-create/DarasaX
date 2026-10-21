-- Require administrator approval for the existing active lecturer cohort.
begin;
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


commit;