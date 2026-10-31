-- Integration fixtures are rolled back, including storage metadata and schedule changes.
begin;
create function pg_temp.check_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAILED: %',label; end if; end; $$;
select set_config('test.student',gen_random_uuid()::text,true),set_config('test.other',gen_random_uuid()::text,true),set_config('test.teacher',gen_random_uuid()::text,true),set_config('test.assignment','test-handin-'||gen_random_uuid()::text,true),set_config('test.import',gen_random_uuid()::text,true),set_config('test.series','import-fixture-'||gen_random_uuid()::text,true);
select set_config('test.cr',(select id::text from public.staff_profiles where role='class_rep' and status='active' and stream_id='BENG24COE-1' limit 1),true);
select set_config('test.admin',(select id::text from public.staff_profiles where role='admin' and status='active' limit 1),true);
insert into auth.users(id,email,email_confirmed_at,created_at,raw_user_meta_data)
select current_setting('test.'||kind)::uuid,'test-'||gen_random_uuid()||'@example.invalid',now(),now(),'{}' from unnest(array['student','other','teacher']) kind;
update public.student_admissions set status='approved',registration_number=repeat('7',60)||'987' where user_id=current_setting('test.student')::uuid;
update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,class_name='BENG24COE-1',onboarding_completed=true where id=current_setting('test.student')::uuid;
insert into public.staff_profiles(id,role,status,stream_id,stream_ids,module_ids) values(current_setting('test.teacher')::uuid,'lecturer','active','BENG24COE-1',array['BENG24COE-1'],array['mod-numerical']);
insert into public.materials(id,title,kind,stream_id,module_id,status,uploaded_by,uploaded_by_id,role,online_submission,due_at)
values(current_setting('test.assignment'),'Submission fixture','assignment','BENG24COE-1','mod-numerical','published','CR',current_setting('test.cr')::uuid,'class_rep',true,now()+interval '1 day');
select set_config('test.path',current_setting('test.assignment')||'/'||current_setting('test.student')||'/fixture.pdf',true);
select set_config('test.exception_date',((now() at time zone 'Africa/Dar_es_Salaam')::date+1+((8-extract(dow from (now() at time zone 'Africa/Dar_es_Salaam')::date+1)::int)%7))::text,true);
insert into public.timetable_entries(id,stream_id,module_id,day,start_time,end_time,room,lecturer)
values(current_setting('test.series'),'BENG24COE-1','mod-numerical',1,'07:00','09:00','Historical fixture','Teacher');
insert into public.timetable_exceptions(entry_id,original_date,session_date,start_time,end_time,module_id,room,lecturer,status)
values(current_setting('test.series'),current_setting('test.exception_date')::date,current_setting('test.exception_date')::date,'07:00','09:00','mod-numerical','Preserved cancellation','Teacher','cancelled');
update private.admin_security_policy set enabled=false;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.student'),'role','authenticated')::text,true);
select pg_temp.check_true(public.can_submit_assignment(current_setting('test.assignment')),'approved class member can submit');
insert into storage.objects(bucket_id,name,metadata) values('assignment-submissions',current_setting('test.path'),'{"size":10,"mimetype":"application/pdf"}');
insert into public.assignment_submissions(assignment_id,student_id,file_path,file_name) values(current_setting('test.assignment'),auth.uid(),current_setting('test.path'),'work.pdf');
select pg_temp.check_true(exists(select 1 from public.assignment_submissions where file_name='work.pdf'),'student sees receipt');
update public.assignment_submissions set file_name='corrected.pdf' where assignment_id=current_setting('test.assignment');
select pg_temp.check_true(exists(select 1 from public.assignment_submissions where file_name='corrected.pdf'),'replacement before deadline allowed');
do $$ begin
 begin insert into public.assignment_submissions(assignment_id,student_id,file_path,file_name) values(current_setting('test.assignment'),auth.uid(),current_setting('test.assignment')||'/'||auth.uid()||'/not-uploaded.pdf','fake.pdf'); raise exception 'FAILED: metadata without file'; exception when raise_exception then if sqlerrm like 'FAILED:%' then raise; end if; end;
 begin perform public.apply_timetable_import('BENG24COE-1',current_date+1,'[]','student',gen_random_uuid()); raise exception 'FAILED: student imported timetable'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
select pg_temp.check_true(not exists(select 1 from public.assignment_submissions where assignment_id=current_setting('test.assignment')),'other student cannot see submissions');
select pg_temp.check_true(not exists(select 1 from storage.objects where bucket_id='assignment-submissions' and name=current_setting('test.path')),'other student cannot read file');
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.teacher'),'role','authenticated')::text,true);
select pg_temp.check_true(exists(select 1 from public.assignment_submissions where assignment_id=current_setting('test.assignment')),'respective lecturer can read submission');
select pg_temp.check_true(exists(select 1 from storage.objects where bucket_id='assignment-submissions' and name=current_setting('test.path')),'respective lecturer can read private object');
reset role;
update public.staff_profiles set module_ids=array['mod-web'] where id=current_setting('test.teacher')::uuid;
set local role authenticated;
select pg_temp.check_true(not exists(select 1 from public.assignment_submissions where assignment_id=current_setting('test.assignment')),'unassigned module lecturer cannot read submission');
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.cr'),'role','authenticated')::text,true);
select pg_temp.check_true(exists(select 1 from public.assignment_submissions where assignment_id=current_setting('test.assignment')),'class CR sees submissions');
do $$ begin
 begin perform public.apply_timetable_import('BENG24COE-2',current_date+1,'[]','wrong class',gen_random_uuid()); raise exception 'FAILED: CR imported another class'; exception when insufficient_privilege then null; end;
 begin perform public.apply_timetable_import('BENG24COE-1',current_date+1,'[{"day":1,"start":"07:00","end":"09:00","moduleId":"mod-numerical","room":"X","lecturer":"Y"},{"day":1,"start":"08:00","end":"10:00","moduleId":"mod-numerical","room":"X","lecturer":"Y"}]','clash',gen_random_uuid()); raise exception 'FAILED: overlaps accepted'; exception when raise_exception then if sqlerrm like 'FAILED:%' then raise; end if; end;
end $$;
select public.apply_timetable_import('BENG24COE-1',(now() at time zone 'Africa/Dar_es_Salaam')::date+1,'[{"day":1,"start":"07:00","end":"09:00","moduleId":"mod-numerical","room":"Imported room","lecturer":"Fixture"}]','fixture.xlsx',current_setting('test.import')::uuid);
select pg_temp.check_true(exists(select 1 from public.get_timetable_occurrences((now() at time zone 'Africa/Dar_es_Salaam')::date+1,(now() at time zone 'Africa/Dar_es_Salaam')::date+8) where series_id=any((select new_ids from public.timetable_imports where id=current_setting('test.import')::uuid)::text[])),'import is visible in dated schedule');
select pg_temp.check_true((select count(*)=1 from public.get_timetable_occurrences(current_setting('test.exception_date')::date,current_setting('test.exception_date')::date) where room='Preserved cancellation' and status='cancelled'),'future cancellation carried over exactly once');
select pg_temp.check_true(not exists(select 1 from public.get_timetable_occurrences(current_setting('test.exception_date')::date,current_setting('test.exception_date')::date) where room='Imported room'),'cancelled imported session is not active');
select pg_temp.check_true(exists(select 1 from public.get_timetable_occurrences((now() at time zone 'Africa/Dar_es_Salaam')::date-7,(now() at time zone 'Africa/Dar_es_Salaam')::date) where room='Historical fixture'),'past schedule preserved');
select public.undo_timetable_import(current_setting('test.import')::uuid);
select pg_temp.check_true(exists(select 1 from public.timetable_exceptions where entry_id=current_setting('test.series') and superseded_at is null),'undo restores original exception identity');
select pg_temp.check_true(not exists(select 1 from public.get_timetable_occurrences((now() at time zone 'Africa/Dar_es_Salaam')::date+1,(now() at time zone 'Africa/Dar_es_Salaam')::date+8) where room='Imported room'),'undo restores previous timetable');
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
select pg_temp.check_true(exists(select 1 from public.assignment_submissions where assignment_id=current_setting('test.assignment')),'admin sees submissions');
reset role;
update public.materials set due_at=now()-interval '1 minute' where id=current_setting('test.assignment');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.student'),'role','authenticated')::text,true);
select pg_temp.check_true(not public.can_submit_assignment(current_setting('test.assignment')),'late submissions blocked');
do $$ begin update public.assignment_submissions set file_name='late.pdf' where assignment_id=current_setting('test.assignment'); if found then raise exception 'FAILED: late replacement allowed'; end if; end $$;
reset role;
update public.materials set online_submission=false,due_at=now()+interval '1 day' where id=current_setting('test.assignment');
set local role authenticated;
select pg_temp.check_true(not public.can_submit_assignment(current_setting('test.assignment')),'offline assignment blocks online upload');
set local role anon;
do $$ begin begin perform id from public.assignment_submissions; raise exception 'FAILED: anonymous submission access'; exception when insufficient_privilege then null; end; end $$;
reset role;
rollback;
