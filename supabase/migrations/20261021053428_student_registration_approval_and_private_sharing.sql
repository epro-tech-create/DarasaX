begin;

create table public.student_admissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  registration_number text unique check (registration_number is null or registration_number ~ '^[0-9]{1,64}$'),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  welcome_seen_at timestamptz,
  legacy_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index student_admissions_status_idx on public.student_admissions(status,submitted_at);
alter table public.student_admissions enable row level security;
revoke all on public.student_admissions from public,anon,authenticated;
grant select on public.student_admissions to authenticated;
grant all on public.student_admissions to service_role;

-- Retain existing completed students' access without inventing registration numbers.
insert into public.student_admissions(user_id,status,welcome_seen_at,legacy_approved)
select p.id,case when p.onboarding_completed then 'approved' else 'pending' end,
  case when p.onboarding_completed then now() end,p.onboarding_completed
from public.profiles p;

create function public.can_review_student(target uuid) returns boolean
language sql stable security definer set search_path=public
as $$ select auth.uid() is not null and exists(
  select 1 from public.staff_profiles s join public.profiles p on p.id=target
  where s.id=auth.uid() and s.status='active'
  and (s.role='admin' or (s.role='class_rep' and s.stream_id=p.class_name))
); $$;
revoke all on function public.can_review_student(uuid) from public,anon;
grant execute on function public.can_review_student(uuid) to authenticated;
create policy "Students and scoped reviewers read admissions" on public.student_admissions
for select to authenticated using(user_id=(select auth.uid()) or public.can_review_student(user_id));

create function public.initialize_student_admission() returns trigger
language plpgsql security definer set search_path=public
as $$ begin
  insert into public.student_admissions(user_id) values(new.id) on conflict do nothing;
  return new;
end; $$;
revoke all on function public.initialize_student_admission() from public,anon,authenticated;
create trigger profiles_admission_init after insert on public.profiles
for each row execute function public.initialize_student_admission();

-- Profile writes cannot skip the required registration-number step.
create function public.guard_student_admission_profile() returns trigger
language plpgsql security definer set search_path=public
as $$ begin
  if new.onboarding_completed and not exists(select 1 from public.student_admissions a where a.user_id=new.id
    and (a.registration_number is not null or a.legacy_approved)) then
    raise exception 'Registration number is required. Complete registration first';
  end if;
  return new;
end; $$;
revoke all on function public.guard_student_admission_profile() from public,anon,authenticated;
create trigger profiles_admission_guard before insert or update on public.profiles
for each row execute function public.guard_student_admission_profile();

create function public.submit_student_registration(reg_number text,target_class text) returns void
language plpgsql security definer set search_path=public
as $$ declare uid uuid:=auth.uid(); admission public.student_admissions; chosen public.academic_classes; current_profile public.profiles;
begin
  if uid is null or exists(select 1 from public.staff_profiles where id=uid) then
    raise exception 'Student access required' using errcode='42501';
  end if;
  if not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then
    raise exception 'Verify your email first' using errcode='42501';
  end if;
  if reg_number is null or reg_number !~ '^[0-9]{1,64}$' then
    raise exception 'Registration number must contain numbers only';
  end if;
  select * into current_profile from public.profiles where id=uid for update;
  if not found then raise exception 'Complete your profile first'; end if;
  select * into chosen from public.academic_classes where id=target_class and not archived
    and institution='Dar es Salaam Institute of Technology (DIT)' and programme='BENG24COE' and year=3 and semester=1;
  if not found then raise exception 'Choose an available class'; end if;
  select * into admission from public.student_admissions where user_id=uid for update;
  if not found then raise exception 'Student admission is unavailable'; end if;
  if admission.status in ('rejected','suspended') then raise exception 'Contact your class representative or administrator'; end if;
  if admission.status='approved' and admission.registration_number is not null and admission.registration_number<>reg_number then
    raise exception 'Contact your administrator to change a registered number';
  end if;
  if current_profile.onboarding_completed and current_profile.class_name is distinct from target_class then
    raise exception 'Contact your administrator to change your class';
  end if;
  update public.student_admissions set registration_number=reg_number,submitted_at=coalesce(submitted_at,now()) where user_id=uid;
  update public.profiles set institution=chosen.institution,programme=chosen.programme,
    year_of_study=chosen.year,semester=chosen.semester,class_name=chosen.id,onboarding_completed=true where id=uid;
exception when unique_violation then
  raise exception 'This registration number is already registered. Sign in to your existing account or contact your administrator.' using errcode='23505';
end; $$;
revoke all on function public.submit_student_registration(text,text) from public,anon;
grant execute on function public.submit_student_registration(text,text) to authenticated;

create function public.list_student_registrations() returns jsonb
language plpgsql stable security definer set search_path=public
as $$ begin
  if not exists(select 1 from public.staff_profiles where id=auth.uid() and status='active' and role in ('admin','class_rep')) then
    raise exception 'Reviewer access required' using errcode='42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('user_id',p.id,'name',p.full_name,'email',p.email,
    'class_name',p.class_name,'registration_number',a.registration_number,'status',a.status,'submitted_at',a.submitted_at)
    order by a.submitted_at desc nulls last)
    from public.student_admissions a join public.profiles p on p.id=a.user_id
    where p.onboarding_completed and public.can_review_student(p.id)
      and not exists(select 1 from public.staff_profiles s where s.id=p.id)), '[]'::jsonb);
end; $$;
revoke all on function public.list_student_registrations() from public,anon;
grant execute on function public.list_student_registrations() to authenticated;

create function public.review_student_registration(student_id uuid,decision text) returns void
language plpgsql security definer set search_path=public
as $$ declare admission public.student_admissions; person public.profiles; reviewer public.staff_profiles;
begin
  if not public.can_review_student(student_id) then raise exception 'You may review only students in your assigned class' using errcode='42501'; end if;
  if decision is null or decision not in ('approved','rejected','suspended') then raise exception 'Invalid decision'; end if;
  if exists(select 1 from public.staff_profiles where id=student_id) then raise exception 'Staff accounts cannot be reviewed as students'; end if;
  select * into person from public.profiles where id=student_id for update;
  select * into admission from public.student_admissions where user_id=student_id for update;
  if not found or not person.onboarding_completed or (admission.registration_number is null and not admission.legacy_approved) then
    raise exception 'The student must complete registration first';
  end if;
  if decision='approved' and not exists(select 1 from public.academic_classes c where c.id=person.class_name and not c.archived
    and c.institution=person.institution and c.programme=person.programme and c.year=person.year_of_study and c.semester=person.semester
    and c.programme='BENG24COE' and c.year=3 and c.semester=1) then raise exception 'Student class is unavailable'; end if;
  select * into reviewer from public.staff_profiles where id=auth.uid() for share;
  if not found or reviewer.status<>'active' or not (reviewer.role='admin' or (reviewer.role='class_rep' and reviewer.stream_id=person.class_name)) then
    raise exception 'You may review only students in your assigned class' using errcode='42501';
  end if;
  update public.student_admissions set status=decision,reviewed_by=auth.uid(),reviewed_at=now() where user_id=student_id;
  -- Approved students enter the staff roster. Pending requests never populate it.
  if decision='approved' then update public.profiles set full_name=full_name where id=student_id; end if;
  insert into public.audit_log(actor,role,action,summary,detail,stream_id,actor_id)
    values(coalesce(reviewer.full_name,reviewer.email,'Staff'),reviewer.role::text,'other',
      initcap(decision)||' student '||coalesce(person.full_name,person.email,'Student'),admission.registration_number,person.class_name,auth.uid());
end; $$;
revoke all on function public.review_student_registration(uuid,text) from public,anon;
grant execute on function public.review_student_registration(uuid,text) to authenticated;

create function public.acknowledge_student_welcome() returns void
language plpgsql security definer set search_path=public
as $$ begin
  if auth.uid() is null or public.active_student_stream() is null then raise exception 'Approved student access required' using errcode='42501'; end if;
  update public.student_admissions set welcome_seen_at=coalesce(welcome_seen_at,now()) where user_id=auth.uid() and status='approved';
end; $$;
revoke all on function public.acknowledge_student_welcome() from public,anon;
grant execute on function public.acknowledge_student_welcome() to authenticated;

create or replace function public.active_student_stream() returns text
language sql stable security definer set search_path=public
as $$ select p.class_name from public.profiles p
join public.student_admissions a on a.user_id=p.id and a.status='approved'
join public.academic_classes c on c.id=p.class_name and not c.archived
where p.id=auth.uid() and p.onboarding_completed and p.institution='Dar es Salaam Institute of Technology (DIT)'
and p.programme='BENG24COE' and p.year_of_study=3 and p.semester=1
and c.institution=p.institution and c.programme=p.programme and c.year=p.year_of_study and c.semester=p.semester; $$;

create or replace function public.sync_student_roster() returns trigger
language plpgsql security definer set search_path=public
as $$ begin
  if exists(select 1 from public.staff_profiles where id=new.id and role in ('admin','lecturer'))
    or not exists(select 1 from public.student_admissions where user_id=new.id and status='approved') then return new; end if;
  insert into public.monitored_students(id,profile_id,name,email,stream_id,year,assignments_total,attendance_pct)
  values(new.id::text,new.id,coalesce(nullif(new.full_name,''),split_part(new.email,'@',1),'Student'),coalesce(new.email,''),
    coalesce(new.class_name,'Unassigned'),coalesce(new.year_of_study,3),0,0)
  on conflict(id) do update set name=excluded.name,email=excluded.email,stream_id=excluded.stream_id,year=excluded.year,profile_id=excluded.profile_id;
  return new;
end; $$;

revoke all on function public.active_student_stream() from public,anon;
grant execute on function public.active_student_stream() to authenticated;
revoke all on function public.sync_student_roster() from public,anon,authenticated;

-- A share identifies a resource; it no longer grants anonymous access to it.
create or replace function public.get_shared_material(share_token uuid) returns jsonb
language sql stable security definer set search_path=public
as $$ select jsonb_build_object('id',m.id,'title',m.title,'kind',m.kind,'body',null,'file_path',m.file_path,
  'file_name',m.file_name,'mime_type',m.mime_type,'size',m.size_label,'module_id',m.module_id,'created_at',m.created_at)
from public.material_shares s join public.materials m on m.id=s.material_id
where auth.uid() is not null and s.token=share_token and m.status='published'
  and m.kind in ('notes','slides','assignment','past_paper') and m.file_path is not null
  and (public.staff_material_scope(m.stream_id,m.module_id) or
    (m.stream_id=public.active_student_stream() and m.programme='BENG24COE' and m.year_of_study=3 and m.semester=1)); $$;
revoke all on function public.get_shared_material(uuid) from public,anon;
grant execute on function public.get_shared_material(uuid) to authenticated;
drop policy if exists "Share token grants access to one published file" on storage.objects;
create or replace function public.shared_material_file_access(object_name text) returns boolean
language sql stable security invoker set search_path=public as $$ select false; $$;
revoke all on function public.shared_material_file_access(text) from public,anon;
grant execute on function public.shared_material_file_access(text) to authenticated;

commit;
