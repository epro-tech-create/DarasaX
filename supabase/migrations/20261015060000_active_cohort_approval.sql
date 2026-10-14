begin;
create or replace function public.guard_student_academics()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
 if auth.role()='authenticated' and not public.is_admin() and tg_op='UPDATE' then
  if (old.semester is not null and old.semester<>1) or (old.year_of_study is not null and old.year_of_study<>3)
   or (old.programme is not null and old.programme<>'BENG24COE')
   or (old.institution is not null and old.institution<>'Dar es Salaam Institute of Technology (DIT)') then
   if new.semester is distinct from old.semester or new.year_of_study is distinct from old.year_of_study
     or new.programme is distinct from old.programme or new.institution is distinct from old.institution
     or new.class_name is distinct from old.class_name or new.onboarding_completed then
    raise exception 'This account requires administrator approval for the active cohort';
   end if;
  end if;
  if old.onboarding_completed and (new.institution is distinct from old.institution or new.programme is distinct from old.programme
   or new.year_of_study is distinct from old.year_of_study or new.semester is distinct from old.semester
   or new.class_name is distinct from old.class_name or not new.onboarding_completed) then
   raise exception 'Academic details are locked. Contact an administrator to change your class.';
  end if;
 end if;
 if new.onboarding_completed and (new.institution is distinct from 'Dar es Salaam Institute of Technology (DIT)'
   or new.programme is distinct from 'BENG24COE' or new.year_of_study is distinct from 3 or new.semester is distinct from 1
   or new.class_name is null or new.class_name not in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4')) then
   raise exception 'Access is available only for DIT BENG24COE, Year 3, Semester 1 with a valid class';
 end if;
 return new;
end; $$;
create or replace function public.apply_roster_profile_edit()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
 if pg_trigger_depth()>1 then return new; end if;
 if new.profile_id is not null and (new.name is distinct from old.name or new.stream_id is distinct from old.stream_id or new.year is distinct from old.year) then
  if not public.is_admin() and auth.role()='authenticated' then raise exception 'Only an administrator may change a registered student class'; end if;
  if new.stream_id in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4') and new.year=3 then
   update public.profiles set full_name=new.name,class_name=new.stream_id,year_of_study=3,semester=1,
    institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',onboarding_completed=true where id=new.profile_id;
  else
   update public.profiles set full_name=new.name,class_name=nullif(new.stream_id,'Unassigned'),year_of_study=new.year,onboarding_completed=false where id=new.profile_id;
  end if;
 end if;
 return new;
end; $$;
commit;
