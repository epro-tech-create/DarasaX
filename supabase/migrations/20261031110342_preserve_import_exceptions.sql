alter table public.timetable_imports add column exception_moves jsonb not null default '[]';
alter table public.materials add constraint online_submission_assignment_class check (not online_submission or (kind='assignment' and stream_id is not null));
create or replace function private.apply_timetable_import(target_class text, starts_on date, sessions jsonb, source_name text, request_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare exception_row record; mapped_id text; moved_id uuid; moves jsonb:='[]'; row jsonb; new_id text; new_ids text[]:='{}'; bounds jsonb; local_today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date;
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
 -- Carry forward dated overrides for matching module/day sessions, retaining original records as history.
 for exception_row in select e.*,t.module_id baseline_module,t.start_time baseline_start
 from public.timetable_exceptions e join public.timetable_entries t on t.id=e.entry_id
 where t.stream_id=target_class and e.superseded_at is null and e.original_date>=starts_on and not(t.id=any(new_ids))
 for update of e loop
  select id into mapped_id from public.timetable_entries where id=any(new_ids)
   and module_id in (exception_row.module_id,exception_row.baseline_module) and day=extract(dow from exception_row.original_date)
   order by abs(extract(epoch from (start_time::time-exception_row.baseline_start::time))),id limit 1;
  if mapped_id is not null then
   moved_id:=gen_random_uuid();
   update public.timetable_exceptions set superseded_at=clock_timestamp() where id=exception_row.id;
   insert into public.timetable_exceptions(id,entry_id,original_date,session_date,start_time,end_time,module_id,room,lecturer,status,reason,created_by)
   values(moved_id,mapped_id,exception_row.original_date,exception_row.session_date,exception_row.start_time,exception_row.end_time,exception_row.module_id,exception_row.room,exception_row.lecturer,exception_row.status,exception_row.reason,auth.uid());
   moves:=moves||jsonb_build_array(jsonb_build_object('old',exception_row.id,'new',moved_id));
  end if;
 end loop;
 insert into public.timetable_imports(id,stream_id,effective_date,filename,previous_bounds,new_ids,created_by,exception_moves)
 values(request_key,target_class,starts_on,left(source_name,255),bounds,new_ids,auth.uid(),moves);
 update private.push_deliveries set state='failed',last_error='timetable_imported' where state in ('pending','processing')
 and lesson_original_date>=starts_on and lesson_id in (select id from public.timetable_entries where stream_id=target_class);
 return request_key;
end; $$;

create or replace function private.undo_timetable_import(import_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare batch public.timetable_imports; bound jsonb; moved jsonb;
begin
 select * into batch from public.timetable_imports where id=import_id;
 if batch.id is null or not public.can_import_timetable(batch.stream_id) then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(hashtextextended(batch.stream_id,0));
 select * into batch from public.timetable_imports where id=import_id for update;
 if batch.undone_at is not null then return; end if;
 if batch.effective_date<(now() at time zone 'Africa/Dar_es_Salaam')::date or exists(select 1 from public.timetable_imports where stream_id=batch.stream_id and undone_at is null and created_at>batch.created_at) then raise exception 'Only the latest import can be undone, before its effective date has passed'; end if;
 if exists(select 1 from public.timetable_changes where entry_id=any(batch.new_ids) and created_at>batch.created_at) then raise exception 'This imported schedule has session edits. Review those changes before replacing it with another import'; end if;
 for moved in select value from jsonb_array_elements(batch.exception_moves) loop
  update public.timetable_exceptions set superseded_at=clock_timestamp() where id=(moved->>'new')::uuid;
  update public.timetable_exceptions set superseded_at=null where id=(moved->>'old')::uuid;
 end loop;
 for bound in select value from jsonb_array_elements(batch.previous_bounds) loop
  update public.timetable_entries set valid_until=(bound->>'until')::date where id=bound->>'id';
 end loop;
 update public.timetable_entries set valid_until=valid_from-1 where id=any(batch.new_ids);
 update public.timetable_imports set undone_at=clock_timestamp() where id=import_id;
 update private.push_deliveries set state='failed',last_error='import_undone' where lesson_id=any(batch.new_ids) and state in ('pending','processing');
end; $$;
