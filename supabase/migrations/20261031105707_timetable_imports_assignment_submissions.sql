-- Private assignment hand-ins. Uploads are opt-in on each assignment.
alter table public.materials add column online_submission boolean not null default false;
create function public.can_submit_assignment(assignment_id text) returns boolean
language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.materials m where m.id=assignment_id
 and m.kind='assignment' and m.status='published' and m.online_submission
 and m.stream_id=public.active_student_stream() and (m.due_at is null or m.due_at>now())); $$;
revoke all on function public.can_submit_assignment(text) from public,anon;
grant execute on function public.can_submit_assignment(text) to authenticated;
create table public.assignment_submissions (
 id uuid primary key default gen_random_uuid(), assignment_id text not null references public.materials(id) on delete cascade,
 student_id uuid not null references auth.users(id) on delete cascade,
 student_name text not null default '', registration_number text,
 file_path text not null unique, file_name text not null check(char_length(file_name) between 1 and 255),
 submitted_at timestamptz not null default now(), unique(assignment_id,student_id)
);
alter table public.assignment_submissions enable row level security;
revoke all on public.assignment_submissions from anon,authenticated;
grant select on public.assignment_submissions to authenticated;
grant insert(assignment_id,student_id,file_path,file_name), update(file_path,file_name) on public.assignment_submissions to authenticated;
grant all on public.assignment_submissions to service_role;
create index assignment_submissions_student on public.assignment_submissions(student_id);
create policy "Submission private readers" on public.assignment_submissions for select to authenticated using(
 student_id=(select auth.uid()) or exists(select 1 from public.materials m where m.id=assignment_id and public.staff_material_scope(m.stream_id,m.module_id)));
create policy "Submit own assignment" on public.assignment_submissions for insert to authenticated
 with check(student_id=(select auth.uid()) and public.can_submit_assignment(assignment_id));
create policy "Replace own submission before deadline" on public.assignment_submissions for update to authenticated
 using(student_id=(select auth.uid()) and public.can_submit_assignment(assignment_id))
 with check(student_id=(select auth.uid()) and public.can_submit_assignment(assignment_id));
create function private.guard_assignment_submission() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or new.student_id<>auth.uid() or not public.can_submit_assignment(new.assignment_id) then
  raise insufficient_privilege using message='Online submissions are closed or this is not your class'; end if;
 if tg_op='UPDATE' and (new.student_id<>old.student_id or new.assignment_id<>old.assignment_id) then raise insufficient_privilege; end if;
 if new.file_path not like new.assignment_id||'/'||auth.uid()::text||'/%' or new.file_path like '%..%'
 or not exists(select 1 from storage.objects where bucket_id='assignment-submissions' and name=new.file_path) then
  raise exception 'Upload the assignment file before submitting'; end if;
 select p.full_name,a.registration_number into new.student_name,new.registration_number from public.profiles p
 left join public.student_admissions a on a.user_id=p.id where p.id=auth.uid();
 new.student_name:=coalesce(new.student_name,'Student'); new.submitted_at:=clock_timestamp(); return new;
end; $$;
revoke all on function private.guard_assignment_submission() from public,anon,authenticated;
create trigger guard_assignment_submission before insert or update on public.assignment_submissions
 for each row execute function private.guard_assignment_submission();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('assignment-submissions','assignment-submissions',false,20971520,array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip','text/plain']);
create policy "Upload own assignment files" on storage.objects for insert to authenticated with check(
 bucket_id='assignment-submissions' and (storage.foldername(name))[2]=(select auth.uid())::text
 and public.can_submit_assignment((storage.foldername(name))[1]));
create policy "Read authorized submission file" on storage.objects for select to authenticated using(
 bucket_id='assignment-submissions' and ((storage.foldername(name))[2]=(select auth.uid())::text or exists(select 1 from public.assignment_submissions s where s.file_path=name)));
create policy "Clean own unreferenced submission file" on storage.objects for delete to authenticated using(
 bucket_id='assignment-submissions' and (storage.foldername(name))[2]=(select auth.uid())::text
 and not exists(select 1 from public.assignment_submissions s where s.file_path=name));

-- Imported schedules have validity dates; earlier history and dated exceptions survive.
alter table public.timetable_entries add column valid_from date, add column valid_until date;
create function public.can_import_timetable(target_class text) returns boolean language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and public.my_staff_role() in ('admin','class_rep') and public.staff_material_scope(target_class,null); $$;
revoke all on function public.can_import_timetable(text) from public,anon;
grant execute on function public.can_import_timetable(text) to authenticated;
create table public.timetable_imports (
 id uuid primary key, stream_id text not null references public.academic_classes(id), effective_date date not null,
 filename text not null, previous_bounds jsonb not null, new_ids text[] not null, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default clock_timestamp(), undone_at timestamptz
);
alter table public.timetable_imports enable row level security;
revoke all on public.timetable_imports from anon,authenticated;
grant select on public.timetable_imports to authenticated;
grant all on public.timetable_imports to service_role;
create policy "Read assigned class imports" on public.timetable_imports for select to authenticated using(public.can_import_timetable(stream_id));
create or replace function public.get_timetable_occurrences(range_start date,range_end date)
returns table(series_id text,original_date date,session_date date,stream_id text,module_id text,day int,start_time text,end_time text,room text,lecturer text,status text,reason text)
language plpgsql stable security invoker set search_path='' as $$
begin
 if range_start is null or range_end is null or range_end<range_start or range_end-range_start>92 then raise exception 'Choose a date range of at most 93 days'; end if;
 return query
 with dates as (
  select t.id entry_id,d::date origin from public.timetable_entries t cross join pg_catalog.generate_series(range_start::timestamp,range_end::timestamp,interval '1 day') d
  union
  select e.entry_id,e.original_date from public.timetable_exceptions e where e.superseded_at is null and e.session_date between range_start and range_end
 ), resolved as (
  select t.id series_id,d.origin original_date,coalesce(e.session_date,d.origin) session_date,t.stream_id,
   coalesce(e.module_id,r.module_id,t.module_id) module_id,coalesce(e.start_time,r.start_time,t.start_time) start_time,
   coalesce(e.end_time,r.end_time,t.end_time) end_time,coalesce(e.room,r.room,t.room) room,coalesce(e.lecturer,r.lecturer,t.lecturer) lecturer,
   coalesce(e.status,r.status,'scheduled') status,coalesce(e.reason,r.reason,'') reason
  from dates d join public.timetable_entries t on t.id=d.entry_id
  left join lateral(select v.* from public.timetable_revisions v where v.entry_id=t.id and v.effective_from<=d.origin and v.superseded_at is null order by v.effective_from desc,v.created_at desc limit 1) r on true
  left join public.timetable_exceptions e on e.entry_id=t.id and e.original_date=d.origin and e.superseded_at is null
  where e.id is not null or ((t.valid_from is null or d.origin>=t.valid_from) and (t.valid_until is null or d.origin<=t.valid_until) and extract(dow from d.origin)=coalesce(r.day,t.day) and (r.id is null or d.origin>=r.first_date))
 ) select x.series_id,x.original_date,x.session_date,x.stream_id,x.module_id,extract(dow from x.session_date)::int,x.start_time,x.end_time,x.room,x.lecturer,x.status,x.reason
 from resolved x where x.session_date between range_start and range_end order by x.session_date,x.start_time,x.series_id;
end; $$;

create function private.apply_timetable_import(target_class text, starts_on date, sessions jsonb, source_name text, request_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare row jsonb; new_id text; new_ids text[]:='{}'; bounds jsonb; local_today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date;
begin
 if not public.can_import_timetable(target_class) then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_class,0));
 if exists(select 1 from public.timetable_imports where id=request_key and created_by=auth.uid() and stream_id=target_class) then return request_key; end if;
 if starts_on is null or starts_on<local_today or starts_on>local_today+365 or request_key is null
 or sessions is null or jsonb_typeof(sessions)<>'array' or jsonb_array_length(sessions) not between 1 and 100 then raise exception 'Choose 1–100 sessions and a current or future effective date'; end if;
 if exists(select 1 from public.timetable_imports where stream_id=target_class and undone_at is null and effective_date>starts_on) then raise exception 'Undo the future import before adding an earlier schedule'; end if;
 for row in select value from jsonb_array_elements(sessions) loop
  if (row->>'day')::int not between 0 and 6 or row->>'day' is null
   or coalesce(row->>'start','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(row->>'end','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
   or row->>'end'<=row->>'start' or char_length(trim(coalesce(row->>'moduleId',''))) not between 1 and 100
   or char_length(trim(coalesce(row->>'room',''))) not between 1 and 200 or char_length(trim(coalesce(row->>'lecturer',''))) not between 1 and 200 then raise exception 'Complete every session with valid days, times, module, room, and lecturer'; end if;
  if row->>'moduleId' not in ('mod-cyber','mod-db-admin','mod-dsa','mod-dsp','mod-electrical','mod-electronics','mod-hci','mod-numerical','mod-se','mod-sensor-networks','mod-web') then raise exception 'Unknown module'; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(sessions) with ordinality a(v,n),jsonb_array_elements(sessions) with ordinality b(v,n)
 where a.n<b.n and a.v->>'day'=b.v->>'day' and a.v->>'start'<b.v->>'end' and b.v->>'start'<a.v->>'end') then raise exception 'Resolve overlapping sessions before importing'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'until',valid_until)),'[]') into bounds from public.timetable_entries
 where stream_id=target_class and (valid_until is null or valid_until>=starts_on);
 update public.timetable_entries set valid_until=starts_on-1 where stream_id=target_class and (valid_until is null or valid_until>=starts_on);
 for row in select value from jsonb_array_elements(sessions) loop
  new_id:='tt-import-'||gen_random_uuid()::text; new_ids:=array_append(new_ids,new_id);
  insert into public.timetable_entries(id,stream_id,module_id,day,start_time,end_time,room,lecturer,created_by,valid_from)
  values(new_id,target_class,row->>'moduleId',(row->>'day')::int,row->>'start',row->>'end',trim(row->>'room'),trim(row->>'lecturer'),auth.uid(),starts_on);
 end loop;
 insert into public.timetable_imports(id,stream_id,effective_date,filename,previous_bounds,new_ids,created_by)
 values(request_key,target_class,starts_on,left(source_name,255),bounds,new_ids,auth.uid());
 update private.push_deliveries set state='failed',last_error='timetable_imported' where state in ('pending','processing')
 and lesson_original_date>=starts_on and lesson_id in (select id from public.timetable_entries where stream_id=target_class);
 return request_key;
end; $$;
revoke all on function private.apply_timetable_import(text,date,jsonb,text,uuid) from public,anon,authenticated;
create function public.apply_timetable_import(target_class text, starts_on date, sessions jsonb, source_name text, request_key uuid)
returns uuid language sql security invoker set search_path='' as $$ select private.apply_timetable_import(target_class,starts_on,sessions,source_name,request_key); $$;
-- Wrappers invoke the private function, which authorizes the caller before any write.
grant execute on function private.apply_timetable_import(text,date,jsonb,text,uuid) to authenticated;
revoke all on function public.apply_timetable_import(text,date,jsonb,text,uuid) from public,anon;
grant execute on function public.apply_timetable_import(text,date,jsonb,text,uuid) to authenticated;
create function private.undo_timetable_import(import_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare batch public.timetable_imports; bound jsonb;
begin
 select * into batch from public.timetable_imports where id=import_id;
 if batch.id is null or not public.can_import_timetable(batch.stream_id) then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(hashtextextended(batch.stream_id,0));
 select * into batch from public.timetable_imports where id=import_id for update;
 if batch.undone_at is not null then return; end if;
 if batch.effective_date<(now() at time zone 'Africa/Dar_es_Salaam')::date or exists(select 1 from public.timetable_imports where stream_id=batch.stream_id and undone_at is null and created_at>batch.created_at) then raise exception 'Only the latest import can be undone, before its effective date has passed'; end if;
 for bound in select value from jsonb_array_elements(batch.previous_bounds) loop
  update public.timetable_entries set valid_until=(bound->>'until')::date where id=bound->>'id';
 end loop;
 update public.timetable_entries set valid_until=valid_from-1 where id=any(batch.new_ids);
 update public.timetable_imports set undone_at=clock_timestamp() where id=import_id;
 update private.push_deliveries set state='failed',last_error='import_undone' where lesson_id=any(batch.new_ids) and state in ('pending','processing');
end; $$;
revoke all on function private.undo_timetable_import(uuid) from public,anon;
grant execute on function private.undo_timetable_import(uuid) to authenticated;
create function public.undo_timetable_import(import_id uuid) returns void language sql security invoker set search_path='' as $$ select private.undo_timetable_import(import_id); $$;
revoke all on function public.undo_timetable_import(uuid) from public,anon;
grant execute on function public.undo_timetable_import(uuid) to authenticated;
