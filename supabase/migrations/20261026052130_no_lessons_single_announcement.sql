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
 if target_class is null or request_key is null or nullif(trim(reason_text),'') is null or length(reason_text)>500 then
 raise exception 'Choose a class and enter a reason of at most 500 characters';
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
 values(lesson.series_id,lesson.original_date,today_date,lesson.start_time,lesson.end_time,lesson.module_id,lesson.room,lesson.lecturer,'cancelled',trim(reason_text),auth.uid());
 update private.push_deliveries set state='failed',last_error='no_lessons_today'
 where lesson_id=lesson.series_id and lesson_original_date=lesson.original_date and state in ('pending','processing');
 changed := changed + 1;
 end loop;
 -- Publication uses the existing announcement feed and its single notification per recipient.
 insert into public.materials(id,title,body,kind,stream_id,status,uploaded_by,uploaded_by_id,role)
 values(notice_id,'No lessons today · '||to_char(today_date,'DD Mon YYYY'),
 'There are no sessions for '||target_class||' today ('||to_char(today_date,'DD Mon YYYY')||', EAT).'||E'\n\n'||trim(reason_text),
 'announcement',target_class,'published',member.full_name,auth.uid(),member.role::text);
 insert into public.audit_log(actor,role,action,summary,detail,stream_id,actor_id)
 values(member.full_name,member.role::text,'announcement','No lessons today',trim(reason_text),target_class,auth.uid());
 return changed;
end; $$;
revoke all on function private.cancel_timetable_today(text,text,uuid) from public,anon;
grant execute on function private.cancel_timetable_today(text,text,uuid) to authenticated;
create or replace function public.cancel_timetable_today(target_class text,reason_text text,request_key uuid)
returns integer language plpgsql security invoker set search_path='' as $$
begin return private.cancel_timetable_today(target_class,reason_text,request_key); end; $$;
revoke all on function public.cancel_timetable_today(text,text,uuid) from public,anon;
grant execute on function public.cancel_timetable_today(text,text,uuid) to authenticated;
