-- Rollback-only fixtures. No HTTP or real notifications are delivered.
begin;
do $$
declare cr uuid; student uuid:=gen_random_uuid(); teacher uuid:=gen_random_uuid();
 series text:='dated-test-'||gen_random_uuid(); reminder text:='reminder-test-'||gen_random_uuid(); starts_now text:='start-test-'||gen_random_uuid();
 today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date; d date; device uuid; rid uuid:=gen_random_uuid(); n int; test_start timestamptz:=now()+interval '29 minutes';
begin
 d:=today+((8-extract(dow from today)::int)%7)+7;
 select id into cr from public.staff_profiles where role='class_rep' and status='active' and stream_id='BENG24COE-1' limit 1;
 if cr is null then raise exception 'An active class representative is required for this rollback test'; end if;
 insert into auth.users(id,email,email_confirmed_at,created_at,raw_user_meta_data) values
 (student,'student-'||student||'@example.invalid',now(),now(),'{}'),(teacher,'teacher-'||teacher||'@example.invalid',now(),now(),'{}');
 insert into public.staff_profiles(id,role,status,stream_id,stream_ids,module_ids) values
 (teacher,'lecturer','active','BENG24COE-1',array['BENG24COE-1'],array['mod-numerical']);
 update public.student_admissions set status='approved',registration_number=repeat('7',60)||'901' where user_id=student;
 update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,class_name='BENG24COE-1',onboarding_completed=true where id=student;
 insert into public.timetable_entries(id,stream_id,module_id,day,start_time,end_time,room,lecturer)
 values(series,'BENG24COE-1','mod-numerical',extract(dow from d),'07:00','09:00','Old room','Fixture lecturer');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',cr,'role','authenticated')::text,true);
 perform public.change_timetable_session(series,d,'once',d,'14:00','16:00','New room','Fixture lecturer','mod-numerical','scheduled','Same-day move',rid);
 perform public.change_timetable_session(series,d,'once',d,'14:00','16:00','New room','Fixture lecturer','mod-numerical','scheduled','Same-day move',rid);
 if (select count(*) from public.timetable_changes where id=rid)<>1 then raise exception 'Idempotency failed'; end if;
 if not exists(select 1 from public.get_timetable_occurrences(d,d) where series_id=series and start_time='14:00') then raise exception 'Single-day change missing'; end if;
 if not exists(select 1 from public.get_timetable_occurrences(d+7,d+7) where series_id=series and start_time='07:00') then raise exception 'Single change modified next week'; end if;
 if not exists(select 1 from public.notifications where source_id=rid::text and recipient_id=student and type='timetable') then raise exception 'Student change notification missing'; end if;
 if exists(select 1 from public.notifications where source_id=rid::text and recipient_id=cr) then raise exception 'Actor notified of own change'; end if;
 perform public.change_timetable_session(series,d,'once',d+2,'11:00','13:00','Moved room','Fixture lecturer','mod-numerical','scheduled','Different date',gen_random_uuid());
 if exists(select 1 from public.get_timetable_occurrences(d,d) where series_id=series) then raise exception 'Moved session remained on original date'; end if;
 if not exists(select 1 from public.get_timetable_occurrences(d+2,d+2) where series_id=series and original_date=d) then raise exception 'Moved session not found outside source range'; end if;
 perform public.change_timetable_session(series,d+7,'future',d+8,'10:00','12:00','Weekly room','Fixture lecturer','mod-numerical','scheduled','Weekly change',gen_random_uuid());
 if exists(select 1 from public.get_timetable_occurrences(d+7,d+7) where series_id=series) then raise exception 'Old weekly day remained'; end if;
 if not exists(select 1 from public.get_timetable_occurrences(d+8,d+8) where series_id=series and start_time='10:00') then raise exception 'New weekly pattern missing'; end if;
 if not exists(select 1 from public.get_timetable_occurrences(d-7,d-7) where series_id=series and start_time='07:00') then raise exception 'History rewritten'; end if;
 if (select start_time from public.timetable_entries where id=series)<>'07:00' then raise exception 'Original timetable changed'; end if;
 perform public.change_timetable_session(series,d+8,'once',d+8,'10:00','12:00','Weekly room','Fixture lecturer','mod-numerical','postponed','Time unknown',gen_random_uuid());
 if not exists(select 1 from public.get_timetable_occurrences(d+8,d+8) where series_id=series and status='postponed') then raise exception 'Postponement missing'; end if;
 perform public.change_timetable_session(series,d+8,'once',d+8,'10:00','12:00','Weekly room','Fixture lecturer','mod-numerical','cancelled','No class',gen_random_uuid());
 if not exists(select 1 from public.get_timetable_occurrences(d+8,d+8) where series_id=series and status='cancelled') then raise exception 'Cancellation missing'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',student,'role','authenticated')::text,true);
 begin perform public.change_timetable_session(series,d+8,'once',d+8,'10:00','12:00','X','X','mod-numerical','scheduled','',gen_random_uuid());raise exception 'Student edit allowed'; exception when insufficient_privilege then null; end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',teacher,'role','authenticated')::text,true);
 begin perform public.change_timetable_session(series,d+8,'once',d+8,'10:00','12:00','X','X','mod-web','scheduled','',gen_random_uuid());raise exception 'Unassigned lecturer module allowed'; exception when insufficient_privilege then null; end;
 perform public.change_timetable_session(series,d+8,'once',d+8,'10:00','12:00','Weekly room','Fixture lecturer','mod-numerical','scheduled','Restored by assigned lecturer',gen_random_uuid());
 -- Exercise the real scheduler, including Sunday mapping and both phases.
 insert into private.push_subscriptions(user_id,endpoint,p256dh,auth,origin,lessons) values(student,'https://fcm.googleapis.com/schedule-fixture-'||student,repeat('A',87),repeat('B',22),'https://www.darasax.com',true) returning id into device;
 insert into public.timetable_entries(id,stream_id,module_id,day,start_time,end_time,room,lecturer) values
 (reminder,'BENG24COE-1','mod-numerical',extract(dow from test_start at time zone 'Africa/Dar_es_Salaam'),to_char(test_start at time zone 'Africa/Dar_es_Salaam','HH24:MI'),'23:59','Reminder room','Fixture lecturer'),
 (starts_now,'BENG24COE-1','mod-numerical',extract(dow from now() at time zone 'Africa/Dar_es_Salaam'),to_char(now() at time zone 'Africa/Dar_es_Salaam','HH24:MI'),'23:59','Start room','Fixture lecturer');
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 perform public.enqueue_lesson_push(); perform public.enqueue_lesson_push();
 if (select count(*) from private.push_deliveries where subscription_id=device and lesson_id=reminder and lesson_phase='advance')<>1 then raise exception '30-minute reminder missing or duplicated'; end if;
 if (select count(*) from private.push_deliveries where subscription_id=device and lesson_id=starts_now and lesson_phase='start')<>1 then raise exception 'Start reminder missing or duplicated'; end if;
 if exists(select 1 from private.push_deliveries where subscription_id=device and lesson_id in (reminder,starts_now)
   and (payload->>'tag' is distinct from 'lesson:'||lesson_id||':'||lesson_original_date or payload->>'lessonPhase' is distinct from lesson_phase)) then raise exception 'Lesson alert tag is not shared across phases'; end if;
 if exists(select 1 from private.push_deliveries where subscription_id=device and lesson_id=reminder and lesson_phase='start') then raise exception 'Start alert sent too early'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',cr,'role','authenticated')::text,true);
 perform public.change_timetable_session(reminder,(test_start at time zone 'Africa/Dar_es_Salaam')::date,'once',(test_start at time zone 'Africa/Dar_es_Salaam')::date,to_char(test_start at time zone 'Africa/Dar_es_Salaam','HH24:MI'),'23:59','Reminder room','Fixture lecturer','mod-numerical','postponed','Delayed',gen_random_uuid());
 if exists(select 1 from private.push_deliveries where subscription_id=device and lesson_id=reminder and state='pending') then raise exception 'Stale reminder not cancelled'; end if;
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 perform public.enqueue_lesson_push();
 if exists(select 1 from private.push_deliveries where subscription_id=device and lesson_id=reminder and state='pending') then raise exception 'Postponed lesson reminder recreated'; end if;
 if not exists(select 1 from public.timetable_entries where id=series) then raise exception 'Original series lost'; end if;
 if has_table_privilege('authenticated','public.timetable_revisions','insert') or has_table_privilege('anon','public.timetable_changes','select') then raise exception 'Timetable write grant exposed'; end if;
 if has_table_privilege('authenticated','public.timetable_entries','update') or has_table_privilege('authenticated','public.timetable_entries','delete') then raise exception 'Baseline can be rewritten or deleted through browser'; end if;
end; $$;
rollback;
