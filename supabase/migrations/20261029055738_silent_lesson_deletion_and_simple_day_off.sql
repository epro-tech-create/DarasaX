-- Deletion records history and cancels reminders without publishing an inbox or phone update.
create or replace function private.change_timetable_session(target_entry text,target_date date,target_scope text,replacement_date date,replacement_start text,replacement_end text,replacement_room text,replacement_lecturer text,replacement_module text,target_status text,reason_text text,request_key uuid)
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
 where target_status<>'cancelled' and private.push_eligible(p.id) and p.id<>auth.uid() and ((s.id is null and p.class_name=base.stream_id)
 or (s.role='class_rep' and s.stream_id=base.stream_id) or (s.role='lecturer' and base.stream_id=any(s.stream_ids) and replacement_module=any(s.module_ids)) or s.role='admin');
 insert into public.audit_log(actor,role,action,summary,detail,stream_id,actor_id)
 select coalesce(s.full_name,'Staff'),s.role::text,'timetable_edit',heading,message,base.stream_id,auth.uid() from public.staff_profiles s where s.id=auth.uid();
end; $$;

-- Stop cancellation updates that were queued before this rule changed.
update private.push_deliveries d set state='failed',last_error='silent_lesson_deletion'
from public.notifications n join public.timetable_changes c on c.id::text=n.source_id
where d.notification_id=n.id and n.source_type='timetable' and c.status='cancelled'
and d.state in ('pending','processing');

-- Keep the legacy RPC signature while removing the reason from this action.
create or replace function private.cancel_timetable_today(target_class text, reason_text text, request_key uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare member public.staff_profiles; lesson record; changed integer := 0;
today_date date := (now() at time zone 'Africa/Dar_es_Salaam')::date;
notice_id text := 'no-lessons-' || target_class || '-' || today_date::text;
begin
 select * into member from public.staff_profiles where id=auth.uid() and status='active';
 if member.id is null or not ((member.role='admin' and public.is_admin())
 or (member.role='class_rep' and member.stream_id=target_class)) then
 raise insufficient_privilege using message='Only verified administrators or the assigned class representative may announce a teaching day off';
 end if;
 if target_class is null or request_key is null then
 raise exception 'Choose a class and confirm the change';
 end if;
 -- Serialize all submissions for the same class/day, including different request keys.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(notice_id,0));
 if exists(select 1 from public.materials where id=notice_id) then return 0; end if;
 for lesson in select * from public.get_timetable_occurrences(today_date,today_date)
 where stream_id=target_class and session_date=today_date and status in ('scheduled','rescheduled')
 order by series_id,original_date
 loop
 perform 1 from public.timetable_entries where id=lesson.series_id for update;
 update public.timetable_exceptions set superseded_at=clock_timestamp()
 where entry_id=lesson.series_id and original_date=lesson.original_date and superseded_at is null;
 insert into public.timetable_exceptions(entry_id,original_date,session_date,start_time,end_time,module_id,room,lecturer,status,reason,created_by)
 values(lesson.series_id,lesson.original_date,today_date,lesson.start_time,lesson.end_time,lesson.module_id,lesson.room,lesson.lecturer,'cancelled','',auth.uid());
 update private.push_deliveries set state='failed',last_error='no_lessons_today'
 where lesson_id=lesson.series_id and lesson_original_date=lesson.original_date and state in ('pending','processing');
 changed := changed + 1;
 end loop;
 -- Publication uses the existing announcement feed and its single notification per recipient.
 insert into public.materials(id,title,body,kind,stream_id,status,uploaded_by,uploaded_by_id,role)
 values(notice_id,'No lessons today · '||to_char(today_date,'DD Mon YYYY'),
 'Class: '||target_class||chr(10)||'Date: '||to_char(today_date,'FMDay, DD Mon YYYY')||' (EAT)'||chr(10)||chr(10)||'No sessions will take place today.',
 'announcement',target_class,'published',member.full_name,auth.uid(),member.role::text);
 insert into public.audit_log(actor,role,action,summary,detail,stream_id,actor_id)
 values(member.full_name,member.role::text,'announcement','No lessons today','Cancelled '||changed||' lessons for today.',target_class,auth.uid());
 return changed;
end; $$;
