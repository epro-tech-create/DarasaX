-- Additive scheduling layer: original timetable rows and historical changes are retained.
begin;
create table public.timetable_revisions (
 id uuid primary key default gen_random_uuid(), entry_id text not null references public.timetable_entries(id),
 effective_from date not null, first_date date not null, day int not null check(day between 0 and 6),
 start_time text not null check(start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 end_time text not null check(end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 module_id text not null, room text not null, lecturer text not null,
 status text not null check(status in ('scheduled','postponed','cancelled')),
 reason text not null default '', created_by uuid references auth.users(id),
 created_at timestamptz not null default clock_timestamp(), superseded_at timestamptz,
 check(end_time>start_time), check(first_date>=effective_from)
);
create index timetable_revision_date on public.timetable_revisions(entry_id,effective_from desc,created_at desc) where superseded_at is null;
create table public.timetable_exceptions (
 id uuid primary key default gen_random_uuid(), entry_id text not null references public.timetable_entries(id),
 original_date date not null, session_date date not null,
 start_time text not null, end_time text not null, module_id text not null, room text not null, lecturer text not null,
 status text not null check(status in ('rescheduled','postponed','cancelled')),
 reason text not null default '', created_by uuid references auth.users(id),
 created_at timestamptz not null default clock_timestamp(), superseded_at timestamptz,
 check(start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and end_time>start_time)
);
create unique index timetable_exception_active on public.timetable_exceptions(entry_id,original_date) where superseded_at is null;
create index timetable_exception_destination on public.timetable_exceptions(session_date) where superseded_at is null;
create table public.timetable_changes (
 id uuid primary key, entry_id text not null references public.timetable_entries(id), original_date date not null,
 scope text not null check(scope in ('once','future')), status text not null,
 reason text not null, details jsonb not null, changed_by uuid references auth.users(id), created_at timestamptz not null default now()
);
alter table public.timetable_revisions enable row level security;
alter table public.timetable_exceptions enable row level security;
alter table public.timetable_changes enable row level security;
revoke all on public.timetable_revisions,public.timetable_exceptions,public.timetable_changes from public,anon,authenticated;
grant select on public.timetable_revisions,public.timetable_exceptions,public.timetable_changes to authenticated;
create policy "Read revisions with timetable access" on public.timetable_revisions for select to authenticated using(exists(select 1 from public.timetable_entries t where t.id=entry_id));
create policy "Read exceptions with timetable access" on public.timetable_exceptions for select to authenticated using(exists(select 1 from public.timetable_entries t where t.id=entry_id));
create policy "Read changes with timetable access" on public.timetable_changes for select to authenticated using(exists(select 1 from public.timetable_entries t where t.id=entry_id));
grant all on public.timetable_revisions,public.timetable_exceptions,public.timetable_changes to service_role;
-- Session changes must use the dated RPC; cancellations never delete the baseline.
revoke update,delete on public.timetable_entries from authenticated;
create policy "Timetable creation stays in assigned module scope" on public.timetable_entries as restrictive for insert to authenticated with check(public.staff_material_scope(stream_id,module_id));

create function public.get_timetable_occurrences(range_start date,range_end date)
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
  where e.id is not null or (extract(dow from d.origin)=coalesce(r.day,t.day) and (r.id is null or d.origin>=r.first_date))
 ) select x.series_id,x.original_date,x.session_date,x.stream_id,x.module_id,extract(dow from x.session_date)::int,x.start_time,x.end_time,x.room,x.lecturer,x.status,x.reason
 from resolved x where x.session_date between range_start and range_end order by x.session_date,x.start_time,x.series_id;
end; $$;
revoke all on function public.get_timetable_occurrences(date,date) from public,anon;
grant execute on function public.get_timetable_occurrences(date,date) to authenticated,service_role;

create function public.timetable_module_label(module_key text) returns text language sql immutable security invoker set search_path='' as $$
select case module_key when 'mod-numerical' then 'Numerical Methods and Matrices' when 'mod-sensor-networks' then 'Sensor Networks' when 'mod-cyber' then 'Cyber Security'
 when 'mod-db-admin' then 'Database Programming and Administration' when 'mod-web' then 'Web Application Development' when 'mod-dsa' then 'Data Structures and Algorithms'
 when 'mod-se' then 'Software Engineering' when 'mod-dsp' then 'Digital Signal Processing' when 'mod-electrical' then 'Electrical Machines'
 when 'mod-hci' then 'Human Computer Interaction' when 'mod-electronics' then 'Electronics' else 'Class session' end;
$$;
revoke all on function public.timetable_module_label(text) from public,anon;
grant execute on function public.timetable_module_label(text) to authenticated,service_role;

alter table public.notifications drop constraint notifications_source_type_check;
alter table public.notifications add constraint notifications_source_type_check check(source_type in ('material','topic','timetable'));
create policy "Read own timetable change notifications" on public.notifications for select to authenticated using(recipient_id=auth.uid() and source_type='timetable' and exists(select 1 from public.timetable_changes c where c.id::text=source_id));

create function public.change_timetable_session(entry_id text,occurrence_date date,change_scope text,new_date date,new_start text,new_end text,new_room text,new_lecturer text,new_module text,change_status text,change_reason text,request_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform private.change_timetable_session(entry_id,occurrence_date,change_scope,new_date,new_start,new_end,new_room,new_lecturer,new_module,change_status,change_reason,request_id);
end; $$;
-- The privileged implementation is private; the public wrapper is an invoker.
create function private.change_timetable_session(target_entry text,target_date date,target_scope text,replacement_date date,replacement_start text,replacement_end text,replacement_room text,replacement_lecturer text,replacement_module text,target_status text,reason_text text,request_key uuid)
returns void language plpgsql security definer set search_path='' as $$
declare base public.timetable_entries; previous record; current_revision public.timetable_revisions; change_id uuid:=request_key;
 local_today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date; message text; heading text;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 select * into base from public.timetable_entries where id=target_entry for update;
 if base.id is null or not public.staff_material_scope(base.stream_id,base.module_id) or not public.staff_material_scope(base.stream_id,replacement_module) then raise insufficient_privilege using message='You may only change sessions for your assigned class and modules'; end if;
 if target_scope not in ('once','future') or target_status not in ('scheduled','postponed','cancelled') or target_date is null or target_date>local_today+365
 or (target_date<local_today and not (target_scope='once' and exists(select 1 from public.timetable_exceptions where entry_id=target_entry and original_date=target_date and session_date>=local_today and superseded_at is null))) then raise exception 'Choose a current or future session date and a valid scope'; end if;
 if request_key is null or length(coalesce(reason_text,''))>500 then raise exception 'Enter a reason of at most 500 characters'; end if;
 if exists(select 1 from public.timetable_changes where id=request_key and changed_by=auth.uid() and entry_id=target_entry) then return; end if;
 select * into current_revision from public.timetable_revisions where entry_id=target_entry and effective_from<=target_date and superseded_at is null order by effective_from desc,created_at desc limit 1;
 if not exists(select 1 from public.timetable_exceptions where entry_id=target_entry and original_date=target_date and superseded_at is null)
 and (extract(dow from target_date)<>coalesce(current_revision.day,base.day) or (current_revision.id is not null and target_date<current_revision.first_date)) then raise exception 'The selected date is not an occurrence of this session'; end if;
 select * into previous from public.get_timetable_occurrences(target_date,target_date) o where o.series_id=target_entry and o.original_date=target_date;
 if replacement_date is null or replacement_date<local_today or (target_scope='future' and replacement_date<target_date) then raise exception 'Choose a valid replacement date'; end if;
 if replacement_start is null or replacement_end is null or replacement_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or replacement_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or replacement_end<=replacement_start then raise exception 'End time must be after start time'; end if;
 if target_status='scheduled' and ((replacement_date+replacement_start::time) at time zone 'Africa/Dar_es_Salaam')<=now() then raise exception 'The new start time must be in the future'; end if;
 if coalesce(trim(replacement_room),'')='' or coalesce(trim(replacement_lecturer),'')='' or coalesce(trim(replacement_module),'')='' or length(replacement_room)>200 or length(replacement_lecturer)>200 or length(replacement_module)>100 then raise exception 'Enter a valid module, room and lecturer'; end if;
 if target_scope='once' then
  update public.timetable_exceptions set superseded_at=clock_timestamp() where entry_id=target_entry and original_date=target_date and superseded_at is null;
  insert into public.timetable_exceptions(entry_id,original_date,session_date,start_time,end_time,module_id,room,lecturer,status,reason,created_by)
  values(target_entry,target_date,case when target_status='scheduled' then replacement_date else target_date end,replacement_start,replacement_end,replacement_module,trim(replacement_room),trim(replacement_lecturer),case when target_status='scheduled' then 'rescheduled' else target_status end,coalesce(trim(reason_text),''),auth.uid());
 else
  update public.timetable_exceptions set superseded_at=clock_timestamp() where entry_id=target_entry and original_date=target_date and superseded_at is null;
  update public.timetable_revisions set superseded_at=clock_timestamp() where entry_id=target_entry and effective_from>=target_date and superseded_at is null;
  insert into public.timetable_revisions(entry_id,effective_from,first_date,day,start_time,end_time,module_id,room,lecturer,status,reason,created_by)
  values(target_entry,target_date,replacement_date,extract(dow from replacement_date),replacement_start,replacement_end,replacement_module,trim(replacement_room),trim(replacement_lecturer),target_status,coalesce(trim(reason_text),''),auth.uid());
 end if;
 -- Invalidate unsent reminders without erasing delivery history.
 update private.push_deliveries set state='failed',last_error='session_changed' where lesson_id=target_entry and state in ('pending','processing')
 and (target_scope='future' and lesson_original_date>=target_date or target_scope='once' and lesson_original_date=target_date);
 insert into public.timetable_changes(id,entry_id,original_date,scope,status,reason,details,changed_by)
 values(change_id,target_entry,target_date,target_scope,target_status,coalesce(trim(reason_text),''),jsonb_build_object('date',replacement_date,'start',replacement_start,'end',replacement_end,'room',replacement_room,'module',replacement_module),auth.uid());
 heading:=case target_status when 'postponed' then 'Session postponed' when 'cancelled' then 'Session cancelled' else 'Session rescheduled' end;
 message:=public.timetable_module_label(replacement_module)||' · '||to_char(target_date,'DD Mon YYYY')||case when previous.start_time is not null then ' '||previous.start_time else '' end;
 if target_status='scheduled' then message:=message||' → '||to_char(replacement_date,'DD Mon YYYY')||' '||replacement_start||'–'||replacement_end||' EAT · '||trim(replacement_room);
 else message:=message||case target_status when 'postponed' then ' · New time to be confirmed' else ' · This session will not take place' end; end if;
 if target_scope='future' then message:=message||' · Weekly from '||to_char(target_date,'DD Mon'); end if;
 if trim(coalesce(reason_text,''))<>'' then message:=message||' · '||trim(reason_text); end if;
 insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href)
 select p.id,'timetable',change_id::text,heading,message,'timetable','/timetable'
 from public.profiles p left join public.staff_profiles s on s.id=p.id and s.status='active'
 where private.push_eligible(p.id) and p.id<>auth.uid() and ((s.id is null and p.class_name=base.stream_id)
 or (s.role='class_rep' and s.stream_id=base.stream_id) or (s.role='lecturer' and base.stream_id=any(s.stream_ids) and replacement_module=any(s.module_ids)) or s.role='admin');
 insert into public.audit_log(actor,role,action,summary,detail,stream_id,actor_id)
 select coalesce(s.full_name,'Staff'),s.role::text,'timetable_edit',heading,message,base.stream_id,auth.uid() from public.staff_profiles s where s.id=auth.uid();
end; $$;
revoke all on function private.change_timetable_session(text,date,text,date,text,text,text,text,text,text,text,uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.change_timetable_session(text,date,text,date,text,text,text,text,text,text,text,uuid) to authenticated;
revoke all on function public.change_timetable_session(text,date,text,date,text,text,text,text,text,text,text,uuid) from public,anon;
grant execute on function public.change_timetable_session(text,date,text,date,text,text,text,text,text,text,text,uuid) to authenticated;

alter table private.push_deliveries add column lesson_original_date date, add column lesson_phase text;
create or replace function public.enqueue_lesson_push() returns void language plpgsql security definer set search_path='' as $$
declare today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date;
begin
 if auth.role()<>'service_role' then raise insufficient_privilege; end if;
 -- Retire the old 10-minute jobs. Already delivered records remain intact.
 update private.push_deliveries set state='failed',last_error='reminder_schedule_updated' where lesson_id is not null and lesson_phase is null and state in ('pending','processing');
 insert into private.push_deliveries(subscription_id,lesson_id,lesson_start,lesson_original_date,lesson_phase,event_key,payload,expires_at)
 select s.id,o.series_id,x.start_at,o.original_date,phase.name,
 'lesson:'||o.series_id||':'||o.original_date||':'||x.start_at||':'||phase.name,
 jsonb_build_object('title',case phase.name when 'advance' then 'DarasaX · Class in 30 minutes' else 'DarasaX · Class starts now' end,
 'body',public.timetable_module_label(o.module_id)||' · '||o.start_time||'–'||o.end_time||' EAT · '||coalesce(nullif(o.room,''),'Room to be confirmed'),
 'href','/timetable','tag','lesson:'||o.series_id||':'||o.original_date||':'||phase.name,'timestamp',extract(epoch from x.start_at)*1000),
 case phase.name when 'advance' then x.start_at else x.start_at+interval '2 minutes' end
 from public.get_timetable_occurrences(today,today+1) o
 cross join lateral(select ((o.session_date+o.start_time::time) at time zone 'Africa/Dar_es_Salaam') start_at) x
 cross join (values('advance'),('start')) phase(name)
 join private.push_subscriptions s on s.lessons
 join public.profiles p on p.id=s.user_id left join public.staff_profiles staff on staff.id=s.user_id and staff.status='active'
 where o.status in ('scheduled','rescheduled') and private.push_eligible(s.user_id)
 and ((phase.name='advance' and x.start_at>now()+interval '28 minutes' and x.start_at<=now()+interval '30 minutes')
 or (phase.name='start' and x.start_at<=now() and x.start_at>now()-interval '2 minutes'))
 and ((staff.id is null and p.class_name=o.stream_id) or (staff.role='class_rep' and staff.stream_id=o.stream_id)
 or (staff.role='lecturer' and o.stream_id=any(staff.stream_ids) and o.module_id=any(staff.module_ids)))
 on conflict(subscription_id,event_key) do update set payload=excluded.payload,state='pending',available_at=now(),attempts=0
 where private.push_deliveries.state='failed' and private.push_deliveries.last_error='session_changed';
 delete from private.push_deliveries where expires_at<now()-interval '7 days';
end; $$;

create or replace function private.push_delivery_allowed(job private.push_deliveries,device private.push_subscriptions) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare n public.notifications; m public.materials; p public.profiles; staff public.staff_profiles; occurrence record; change_stream text;
begin
 if not private.push_eligible(device.user_id) then return false; end if;
 select * into p from public.profiles where id=device.user_id;
 select * into staff from public.staff_profiles where id=device.user_id and status='active';
 if job.lesson_id is not null then
  if not device.lessons or job.lesson_original_date is null then return false; end if;
  select * into occurrence from public.get_timetable_occurrences((job.lesson_start at time zone 'Africa/Dar_es_Salaam')::date,(job.lesson_start at time zone 'Africa/Dar_es_Salaam')::date) o
  where o.series_id=job.lesson_id and o.original_date=job.lesson_original_date and o.status in ('scheduled','rescheduled')
  and ((o.session_date+o.start_time::time) at time zone 'Africa/Dar_es_Salaam')=job.lesson_start;
  if not found then return false; end if;
  return (staff.id is null and p.class_name=occurrence.stream_id) or (staff.role='class_rep' and staff.stream_id=occurrence.stream_id)
  or (staff.role='lecturer' and occurrence.stream_id=any(staff.stream_ids) and occurrence.module_id=any(staff.module_ids));
 end if;
 if job.notification_id is null then return true; end if;
 if not device.updates then return false; end if;
 select * into n from public.notifications where id=job.notification_id and recipient_id=device.user_id;
 if n.id is null or n.read_at is not null then return false; end if;
 if n.source_type='topic' then return exists(select 1 from public.module_topics where id=n.source_id and published); end if;
 if n.source_type='timetable' then
  select t.stream_id into change_stream from public.timetable_changes c join public.timetable_entries t on t.id=c.entry_id where c.id::text=n.source_id;
  return change_stream is not null and ((staff.id is null and p.class_name=change_stream) or staff.role='admin' or (staff.role='class_rep' and staff.stream_id=change_stream)
   or (staff.role='lecturer' and change_stream=any(staff.stream_ids)));
 end if;
 select * into m from public.materials where id=n.source_id and status='published';
 if m.id is null then return false; end if;
 return (staff.id is null and (m.stream_id is null or m.stream_id=p.class_name) and m.programme=p.programme and m.year_of_study=p.year_of_study and m.semester=p.semester)
 or staff.role='admin' or (staff.role='class_rep' and (m.stream_id is null or staff.stream_id=m.stream_id))
 or (staff.role='lecturer' and (m.stream_id is null or m.stream_id=any(staff.stream_ids)) and (m.module_id is null or m.module_id=any(staff.module_ids)));
end; $$;
commit;
