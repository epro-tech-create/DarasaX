-- Synthetic identities exist only in this rollback transaction, never in app data.
begin;
create function pg_temp.check_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAILED: %',label; end if; end; $$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000001101','admin@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000001102','mbunge@example.invalid',now(),'{"full_name":"Appointed Student","is_mbunge":true}'),
 ('00000000-0000-4000-8000-000000001103','other@example.invalid',now(),'{"full_name":"Other Student","is_mbunge":true}'),
 ('00000000-0000-4000-8000-000000001104','pending@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000001105','cr@example.invalid',now(),'{}');
update public.profiles set class_name=case when id='00000000-0000-4000-8000-000000001103' then 'BENG24COE-2' else 'BENG24COE-1' end,
 institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,onboarding_completed=true;
update public.student_admissions set status='approved' where user_id<>'00000000-0000-4000-8000-000000001104';
insert into public.staff_profiles(id,role,status,stream_id) values
 ('00000000-0000-4000-8000-000000001101','admin','active',null),
 ('00000000-0000-4000-8000-000000001105','class_rep','active','BENG24COE-1');
insert into auth.sessions(id,user_id) values('00000000-0000-4000-8000-000000001199','00000000-0000-4000-8000-000000001101');
insert into private.admin_verified_sessions(session_id,user_id,expires_at) values('00000000-0000-4000-8000-000000001199','00000000-0000-4000-8000-000000001101',now()+interval '1 hour');
update private.admin_security_policy set enabled=true;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000001102","role":"authenticated"}',true);
select pg_temp.check_true(not public.is_mbunge(),'user metadata does not grant appointment');
do $$ begin
 begin perform public.appoint_mbunge('mbunge@example.invalid'); raise exception 'FAILED: self appointment'; exception when insufficient_privilege then null; end;
 begin insert into public.mbunge_appointments(student_id,appointed_by) values(auth.uid(),auth.uid()); raise exception 'FAILED: direct appointment insert'; exception when insufficient_privilege then null; end;
 begin perform public.mbunge_students(); raise exception 'FAILED: unappointed directory'; exception when insufficient_privilege then null; end;
end; $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000001101","role":"authenticated"}',true);
do $$ begin
 begin perform public.appoint_mbunge('mbunge@example.invalid'); raise exception 'FAILED: missing admin stepup'; exception when insufficient_privilege then null; end;
end; $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000001101","session_id":"00000000-0000-4000-8000-000000001199","role":"authenticated"}',true);
do $$ begin
 begin perform public.appoint_mbunge('pending@example.invalid'); raise exception 'FAILED: pending appointment'; exception when raise_exception then if sqlerrm like 'FAILED:%' then raise; end if; end;
 begin perform public.appoint_mbunge('cr@example.invalid'); raise exception 'FAILED: staff appointment'; exception when raise_exception then if sqlerrm like 'FAILED:%' then raise; end if; end;
end; $$;
select public.appoint_mbunge('  MBUNGE@example.invalid  ');
select pg_temp.check_true(jsonb_array_length(public.list_mbunge_appointments())=1,'admin appointment directory');
do $$ begin
 begin perform public.appoint_mbunge('other@example.invalid'); raise exception 'FAILED: duplicate active appointment'; exception when raise_exception then if sqlerrm like 'FAILED:%' then raise; end if; end;
end; $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000001102","role":"authenticated"}',true);
select pg_temp.check_true(public.is_mbunge(),'appointment recognized');
select pg_temp.check_true(not public.is_staff() and public.my_staff_role() is null,'Mbunge remains a student');
select pg_temp.check_true((select class_name='BENG24COE-1' from public.profiles where id=auth.uid()),'home class retained');
select pg_temp.check_true(public.can_publish_material(null,'mod-web') and public.can_publish_material('BENG24COE-2','mod-web'),'global and other class publication');
select pg_temp.check_true(not public.can_publish_material('missing','mod-web'),'unknown class blocked');
select pg_temp.check_true(public.can_manage_timetable('BENG24COE-2','mod-web') and public.can_import_timetable('BENG24COE-2'),'other class timetable management');
select pg_temp.check_true(not public.staff_material_scope('BENG24COE-2','mod-web'),'unrelated staff submission scope is not granted');
select private.change_timetable_session('fixture',current_date,'once',current_date,'09:00','10:00','Lab','Lecturer','mod-web','scheduled','',gen_random_uuid());
select private.cancel_timetable_today('BENG24COE-2','',gen_random_uuid());
select pg_temp.check_true(not public.can_review_student('00000000-0000-4000-8000-000000001103'),'student approval not granted');
select pg_temp.check_true(jsonb_array_length(public.mbunge_students())=4,'directory only includes approved students');
insert into public.materials(id,title,role,uploaded_by_id,stream_id,module_id) values('mbunge-test-file','Real permission test','class_rep',auth.uid(),'BENG24COE-2','mod-web');
insert into public.timetable_entries(id,stream_id,module_id,created_by) values('mbunge-test-lesson','BENG24COE-2','mod-web',auth.uid());
do $$ begin
 begin insert into public.materials(id,title,role,uploaded_by_id) values('mbunge-forge','Forged','admin',auth.uid()); raise exception 'FAILED: forged publisher'; exception when insufficient_privilege then null; end;
 begin perform public.revoke_mbunge(auth.uid()); raise exception 'FAILED: student revocation'; exception when insufficient_privilege then null; end;
end; $$;
insert into public.class_messages(id,room_id,author_id,author_name,body,created_at) values
 ('00000000-0000-4000-8000-000000001201','BENG24COE-1',auth.uid(),'Forged name','Class message',now()+interval '1 year'),
 ('00000000-0000-4000-8000-000000001202','__all__',auth.uid(),'Forged name','Global message',now()+interval '1 year');
select pg_temp.check_true((select author_name='Appointed Student' and created_at<now()+interval '1 minute' from public.class_messages where id='00000000-0000-4000-8000-000000001201'),'message author and date stamped by database');
do $$ begin
 begin insert into public.class_messages(room_id,author_id,author_name,body) values('BENG24COE-2',auth.uid(),'X','Forbidden room'); raise exception 'FAILED: cross class send'; exception when insufficient_privilege then null; end;
 begin insert into public.class_messages(room_id,author_id,author_name,body) values('__all__','00000000-0000-4000-8000-000000001103','X','Forged author'); raise exception 'FAILED: forged chat author'; exception when insufficient_privilege then null; end;
end; $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000001103","role":"authenticated"}',true);
select pg_temp.check_true(not public.is_mbunge(),'metadata still cannot impersonate appointed student');
select pg_temp.check_true((select count(*)=1 from public.class_messages),'only global room visible across classes');
select pg_temp.check_true((public.chat_unread_counts()->>'__all__')::int=1,'real unread counts');
insert into public.class_message_reads(user_id,room_id,read_at) select auth.uid(),'__all__',created_at from public.class_messages where id='00000000-0000-4000-8000-000000001202';
select pg_temp.check_true(public.chat_unread_counts()='{}'::jsonb,'read receipt clears badge');
with changed as (delete from public.class_messages returning id) select pg_temp.check_true(not exists(select 1 from changed),'cannot delete another author message');
do $$ begin
 begin insert into public.timetable_entries values('forbidden-lesson','BENG24COE-1','mod-web',auth.uid()); raise exception 'FAILED: student timetable write'; exception when insufficient_privilege then null; end;
 begin perform public.list_mbunge_appointments(); raise exception 'FAILED: student admin list'; exception when insufficient_privilege then null; end;
end; $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000001105","role":"authenticated"}',true);
select pg_temp.check_true(public.staff_material_scope('BENG24COE-1','mod-web') and not public.staff_material_scope('BENG24COE-2','mod-web'),'existing CR scope preserved');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000001101","session_id":"00000000-0000-4000-8000-000000001199","role":"authenticated"}',true);
select public.revoke_mbunge('00000000-0000-4000-8000-000000001102');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000001102","role":"authenticated"}',true);
select pg_temp.check_true(not public.is_mbunge() and not public.can_publish_material(null,'mod-web') and not public.can_import_timetable('BENG24COE-2'),'revocation immediately removes management permissions');
do $$ begin
 begin perform public.mbunge_students(); raise exception 'FAILED: revoked directory'; exception when insufficient_privilege then null; end;
 begin insert into public.materials(id,title,role,uploaded_by_id) values('revoked-file','Forbidden','class_rep',auth.uid()); raise exception 'FAILED: revoked publishing'; exception when insufficient_privilege then null; end;
end; $$;
select pg_temp.check_true(public.active_student_stream()='BENG24COE-1','revocation preserves student membership');
insert into public.class_messages(room_id,author_id,body) values('__all__',auth.uid(),'Still a student');
with changed as (delete from public.class_messages where author_id=auth.uid() returning id) select pg_temp.check_true(exists(select 1 from changed),'authors can delete their own messages');
reset role;
rollback;
