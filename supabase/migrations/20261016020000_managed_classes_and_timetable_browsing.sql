begin;
create table public.academic_classes (
 id text primary key check(id ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'),
 label text not null check(length(label) between 3 and 80),
 institution text not null,
 programme text not null,
 year integer not null check(year between 1 and 4),
 semester integer not null check(semester in (1,2)),
 is_evening boolean not null default false,
 archived boolean not null default false,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
insert into public.academic_classes(id,label,institution,programme,year,semester,is_evening)
select 'BENG24COE-'||n,'BENG24COE-'||n,'Dar es Salaam Institute of Technology (DIT)','BENG24COE',3,1,n=2 from generate_series(1,4) n;
alter table public.academic_classes enable row level security;
revoke all on public.academic_classes from anon,authenticated;
grant select on public.academic_classes to authenticated;
create policy "Signed in users see available classes" on public.academic_classes for select to authenticated using(not archived or public.is_staff());

create function public.add_academic_class(class_id text,class_label text,class_institution text,class_programme text,class_year integer,class_semester integer,evening boolean default false) returns void
language plpgsql security definer set search_path=public
as $$ begin
 if not exists(select 1 from public.staff_profiles where id=auth.uid() and role in ('admin','class_rep') and status='active') then raise exception 'Not authorized' using errcode='42501'; end if;
 insert into public.academic_classes(id,label,institution,programme,year,semester,is_evening,created_by)
 values(upper(trim(class_id)),trim(class_label),trim(class_institution),upper(trim(class_programme)),class_year,class_semester,evening,auth.uid());
end; $$;
create function public.archive_academic_class(class_id text) returns void
language plpgsql security definer set search_path=public
as $$ begin
 if not exists(select 1 from public.staff_profiles s where s.id=auth.uid() and s.status='active' and (s.role='admin' or (s.role='class_rep' and (s.stream_id=class_id or exists(select 1 from public.academic_classes c where c.id=class_id and c.created_by=auth.uid()))))) then raise exception 'Not authorized' using errcode='42501'; end if;
 update public.academic_classes set archived=true where id=class_id;
end; $$;
revoke all on function public.add_academic_class(text,text,text,text,integer,integer,boolean),public.archive_academic_class(text) from public,anon;
grant execute on function public.add_academic_class(text,text,text,text,integer,integer,boolean),public.archive_academic_class(text) to authenticated;

create or replace function public.active_student_stream() returns text language sql stable security definer set search_path=public
as $$ select p.class_name from public.profiles p join public.academic_classes c on c.id=p.class_name and not c.archived
 where p.id=auth.uid() and p.onboarding_completed and p.institution='Dar es Salaam Institute of Technology (DIT)' and p.programme='BENG24COE' and p.year_of_study=3 and p.semester=1
 and c.institution=p.institution and c.programme=p.programme and c.year=p.year_of_study and c.semester=p.semester; $$;
drop policy "Timetable readable for own class" on public.timetable_entries;
create policy "Students browse class timetables" on public.timetable_entries for select to authenticated
using(public.active_student_stream() is not null or public.staff_material_scope(stream_id,null));
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
   or new.class_name is null or not exists(select 1 from public.academic_classes c where c.id=new.class_name and not c.archived and c.institution=new.institution and c.programme=new.programme and c.year=new.year_of_study and c.semester=new.semester)) then
   raise exception 'Access is available only for DIT BENG24COE, Year 3, Semester 1 with a valid class';
 end if;
 return new;
end; $$;

commit;
