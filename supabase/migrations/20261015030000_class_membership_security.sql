begin;
create or replace function public.active_student_stream()
returns text language sql stable security definer set search_path=public
as $$ select class_name from public.profiles where id=auth.uid() and onboarding_completed
 and institution='Dar es Salaam Institute of Technology (DIT)' and programme='BENG24COE'
 and year_of_study=3 and semester=1 and class_name in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4'); $$;
create or replace function public.staff_material_scope(target_stream text, target_module text default null)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.staff_profiles s where s.id=auth.uid() and status='active'
 and (role='admin' or (role='class_rep' and stream_id=target_stream)
 or (role='lecturer' and target_stream=any(stream_ids) and (target_module is null or target_module=any(module_ids))))); $$;

create or replace function public.guard_student_academics()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
 if auth.role()='authenticated' and not public.is_admin() and tg_op='UPDATE' then
  if old.onboarding_completed and (new.institution is distinct from old.institution or new.programme is distinct from old.programme
   or new.year_of_study is distinct from old.year_of_study or new.semester is distinct from old.semester
   or new.class_name is distinct from old.class_name or not new.onboarding_completed) then
   raise exception 'Academic details are locked. Contact an administrator to change your class.';
  end if;
 end if;
 if new.onboarding_completed and (new.institution is distinct from 'Dar es Salaam Institute of Technology (DIT)'
   or new.programme is distinct from 'BENG24COE' or new.year_of_study is distinct from 3 or new.semester is distinct from 1
   or new.class_name is null or new.class_name not in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4')) then
   raise exception 'Access is currently available only for DIT BENG24COE, Year 3, Semester 1. Select a valid class.';
 end if;
 return new;
end; $$;
-- Existing students must choose their real class; do not guess missing membership.
update public.profiles set onboarding_completed=false
where onboarding_completed and (programme is distinct from 'BENG24COE' or institution is distinct from 'Dar es Salaam Institute of Technology (DIT)'
 or year_of_study is distinct from 3 or semester is distinct from 1 or class_name is null
 or class_name not in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4'));
create trigger student_academic_guard before insert or update on public.profiles
for each row execute function public.guard_student_academics();

alter table public.materials add column programme text not null default 'BENG24COE',
 add column year_of_study integer not null default 3, add column semester integer not null default 1,
 add column due_at timestamptz;
-- Unassigned legacy publications are withheld until staff selects the recipient class.
update public.materials set status='pending' where status='published' and stream_id is null;
create or replace function public.require_material_class()
returns trigger language plpgsql set search_path=public
as $$ begin
 if new.status='published' and (new.stream_id is null or new.stream_id not in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4')) then
  raise exception 'Choose a particular class before publishing.';
 end if;
 if new.programme<>'BENG24COE' or new.year_of_study<>3 or new.semester<>1 then raise exception 'Unsupported course or semester'; end if;
 return new;
end; $$;
create trigger material_class_required before insert or update on public.materials
for each row execute function public.require_material_class();
drop policy "Materials readable when published or by staff" on public.materials;
drop policy "Materials writable by staff in scope" on public.materials;
create policy "Class materials readable by authorized users" on public.materials for select to authenticated
using (public.staff_material_scope(stream_id,module_id) or (status='published' and stream_id=public.active_student_stream()
 and programme='BENG24COE' and year_of_study=3 and semester=1));
create policy "Class materials inserted by scoped staff" on public.materials for insert to authenticated with check(public.staff_material_scope(stream_id,module_id));
create policy "Class materials updated by scoped staff" on public.materials for update to authenticated using(public.staff_material_scope(stream_id,module_id)) with check(public.staff_material_scope(stream_id,module_id));
create policy "Class materials deleted by scoped staff" on public.materials for delete to authenticated using(public.staff_material_scope(stream_id,module_id));
drop policy "Materials bucket readable by signed-in users" on storage.objects;
create policy "Materials objects follow class visibility" on storage.objects for select to authenticated
using(bucket_id='materials' and (exists(select 1 from public.materials m where m.file_path=name) or public.is_admin() or (owner_id=auth.uid()::text and public.staff_material_scope((storage.foldername(name))[1],null))));
drop policy "Materials bucket writable by staff" on storage.objects;
drop policy "Materials bucket updatable by staff" on storage.objects;
drop policy "Materials bucket deletable by staff" on storage.objects;
create policy "Materials objects uploaded in staff class" on storage.objects for insert to authenticated
with check(bucket_id='materials' and public.staff_material_scope((storage.foldername(name))[1],null));
create policy "Materials objects updated in staff class" on storage.objects for update to authenticated
using(bucket_id='materials' and public.staff_material_scope((storage.foldername(name))[1],null))
with check(bucket_id='materials' and public.staff_material_scope((storage.foldername(name))[1],null));
create policy "Materials objects deleted in staff class" on storage.objects for delete to authenticated
using(bucket_id='materials' and public.staff_material_scope((storage.foldername(name))[1],null));
drop policy "Timetable readable by signed-in users" on public.timetable_entries;
create policy "Timetable readable for own class" on public.timetable_entries for select to authenticated
using(stream_id=public.active_student_stream() or public.staff_material_scope(stream_id,null));
drop policy "Topics readable when published or by staff" on public.module_topics;
create policy "Topics readable for active cohort" on public.module_topics for select to authenticated
using(public.is_staff() or (published and public.active_student_stream() is not null));

alter table public.monitored_students add column profile_id uuid unique references public.profiles(id) on delete cascade;
create or replace function public.sync_student_roster()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
 if exists(select 1 from public.staff_profiles where id=new.id and role in ('admin','lecturer')) then return new; end if;
 insert into public.monitored_students(id,profile_id,name,email,stream_id,year,assignments_total,attendance_pct)
 values(new.id::text,new.id,coalesce(nullif(new.full_name,''),split_part(new.email,'@',1),'Student'),coalesce(new.email,''),coalesce(new.class_name,'Unassigned'),coalesce(new.year_of_study,3),0,0)
 on conflict(id) do update set name=excluded.name,email=excluded.email,stream_id=excluded.stream_id,year=excluded.year,profile_id=excluded.profile_id;
 return new;
end; $$;
create trigger profiles_sync_roster after insert or update on public.profiles for each row execute function public.sync_student_roster();
-- Backfill registered users without changing their academic membership.
update public.profiles set updated_at=updated_at;
create or replace function public.sync_roster_staff_membership()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
 if new.role in ('admin','lecturer') then delete from public.monitored_students where profile_id=new.id; end if;
 return new;
end; $$;
create trigger staff_sync_roster after insert or update on public.staff_profiles for each row execute function public.sync_roster_staff_membership();
create or replace function public.apply_roster_profile_edit()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
 if pg_trigger_depth()>1 then return new; end if;
 if new.profile_id is not null and (new.name is distinct from old.name or new.stream_id is distinct from old.stream_id or new.year is distinct from old.year) then
  if not public.is_admin() and auth.role()='authenticated' then raise exception 'Only an administrator may change a registered student class'; end if;
  update public.profiles set full_name=new.name,class_name=nullif(new.stream_id,'Unassigned'),year_of_study=new.year where id=new.profile_id;
 end if;
 return new;
end; $$;
create trigger roster_sync_profile after update on public.monitored_students for each row execute function public.apply_roster_profile_edit();
-- Inbox visibility follows the current class, including approved class transfers.
drop policy "Users read only their notifications" on public.notifications;
create policy "Users read own current class notifications" on public.notifications for select to authenticated
using(recipient_id=auth.uid() and (
 (source_type='material' and exists(select 1 from public.materials m where m.id=source_id))
 or (source_type='topic' and exists(select 1 from public.module_topics t where t.id=source_id))));
create or replace function public.notify_material_publication()
returns trigger language plpgsql security definer set search_path = public
as $$ declare event_at timestamptz := clock_timestamp(); notification_kind text; destination text; heading text;
begin
  if tg_op = 'DELETE' then
    delete from public.notifications where source_type='material' and source_id=old.id;
    return old;
  end if;
  if new.status <> 'published' then
    delete from public.notifications where source_type='material' and source_id=new.id;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.status = 'published' then return new; end if;
  end if;
  notification_kind := case when new.kind in ('notes','slides') then 'notes' when new.kind='past_paper' then 'exam' when new.kind='assignment' then 'assignment' else 'announcement' end;
  heading := case new.kind when 'notes' then 'New notes uploaded' when 'slides' then 'New slides uploaded' when 'past_paper' then 'New past paper' when 'assignment' then 'New assignment' when 'announcement' then 'New announcement' else 'New material' end;
  destination := case new.kind when 'past_paper' then '/past-papers' when 'announcement' then '/announcements' when 'assignment' then '/assignments' else case when new.module_id is not null then '/modules/' || new.module_id else '/modules' end end;
  insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href,created_at)
  select p.id,'material',new.id,heading,new.title,notification_kind,destination,event_at
  from public.profiles p join auth.users u on u.id=p.id
  where u.created_at <= event_at and u.email_confirmed_at is not null
    and ((p.onboarding_completed and p.institution='Dar es Salaam Institute of Technology (DIT)' and p.programme='BENG24COE' and p.year_of_study=3 and p.semester=1)
      or exists(select 1 from public.staff_profiles staff where staff.id=p.id and staff.status='active'))
    and (new.stream_id is null or p.class_name = new.stream_id
      or exists(select 1 from public.staff_profiles s where s.id=p.id and s.status='active'
        and (s.role='admin' or s.stream_id = new.stream_id or new.stream_id = any(s.stream_ids))))
    and p.id is distinct from new.uploaded_by_id
  on conflict(recipient_id,source_type,source_id) do nothing;
  return new;
end; $$;


create or replace function public.notify_topic_publication()
returns trigger language plpgsql security definer set search_path = public
as $$ declare event_at timestamptz := clock_timestamp();
begin
  if tg_op = 'DELETE' then
    delete from public.notifications where source_type='topic' and source_id=old.id;
    return old;
  end if;
  if not new.published then
    delete from public.notifications where source_type='topic' and source_id=new.id;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.published then return new; end if;
  end if;
  insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href,created_at)
  select p.id,'topic',new.id,'New topic published',new.title,'announcement',
    '/modules/' || new.module_id || '/topics/' || new.id,event_at
  from public.profiles p join auth.users u on u.id=p.id
  where u.created_at <= event_at and u.email_confirmed_at is not null
    and ((p.onboarding_completed and p.institution='Dar es Salaam Institute of Technology (DIT)' and p.programme='BENG24COE' and p.year_of_study=3 and p.semester=1)
      or exists(select 1 from public.staff_profiles staff where staff.id=p.id and staff.status='active'))
    and p.id is distinct from new.created_by_id
  on conflict(recipient_id,source_type,source_id) do nothing;
  return new;
end; $$;

commit;
