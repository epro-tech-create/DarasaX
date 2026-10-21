-- Local integration tests. Never sends email; every synthetic account rolls back.
begin;
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAILED: %',label; end if; end; $$;
insert into auth.users(id,email,encrypted_password,email_confirmed_at,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000101','admin-one@example.invalid','fixture',now(),'{"full_name":"Admin one"}'),
('00000000-0000-4000-8000-000000000102','admin-two@example.invalid','fixture',now(),'{"full_name":"Admin two"}'),
('00000000-0000-4000-8000-000000000103','pending-lecturer@example.invalid','fixture',now(),'{"full_name":"Pending lecturer"}'),
('00000000-0000-4000-8000-000000000104','rejected-lecturer@example.invalid','fixture',now(),'{"full_name":"Rejected lecturer"}'),
('00000000-0000-4000-8000-000000000105','unverified@example.invalid','fixture',null,'{}'),
('00000000-0000-4000-8000-000000000106','existing-lecturer@example.invalid','fixture',now(),'{}'),
('00000000-0000-4000-8000-000000000107','registered-student@example.invalid','fixture',now(),'{}'),
('00000000-0000-4000-8000-000000000108','class-rep@example.invalid','fixture',now(),'{}');
insert into auth.identities(user_id,provider_id,identity_data,provider) select id,id::text,'{}','email' from auth.users where id::text like '00000000-0000-4000-8000-00000000010%';
insert into public.staff_profiles(id,role,status) values
('00000000-0000-4000-8000-000000000101','admin','active'),
('00000000-0000-4000-8000-000000000102','admin','active'),
('00000000-0000-4000-8000-000000000106','lecturer','active');
insert into public.staff_profiles(id,role,status,stream_id) values('00000000-0000-4000-8000-000000000108','class_rep','active','BENG24COE-1');
insert into auth.sessions(id,user_id) values
('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000101'),
('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000101'),
('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000101'),
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000102');
update private.admin_security_policy set enabled=true;
insert into storage.objects(name) values('private-object');
update public.student_admissions set registration_number='240242400506',submitted_at=now() where user_id='00000000-0000-4000-8000-000000000107';
update public.profiles set class_name='BENG24COE-1',institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,onboarding_completed=true where id in ('00000000-0000-4000-8000-000000000107','00000000-0000-4000-8000-000000000101');
update public.student_admissions set status='approved' where user_id in ('00000000-0000-4000-8000-000000000107','00000000-0000-4000-8000-000000000101');

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000103','role','authenticated')::text,true);
select public.complete_lecturer_registration();
select public.complete_lecturer_registration();
select pg_temp.assert_true((public.lecturer_application_status()->>'status')='pending','new verified lecturer is pending, idempotently');
select pg_temp.assert_true(exists(select 1 from public.staff_profiles where id=auth.uid() and status='inactive' and stream_ids='{}'),'pending lecturer has no active class privileges');
do $$ begin
 begin perform public.complete_lecturer_setup(array['BENG24COE-1'],array['mod-web']); raise exception 'FAILED: pending lecturer setup permitted'; exception when insufficient_privilege then null; end;
 begin perform public.review_lecturer_application(auth.uid(),'approve'); raise exception 'FAILED: self approval'; exception when insufficient_privilege then null; end;
 begin update public.staff_profiles set status='active' where id=auth.uid(); raise exception 'FAILED: direct self activation'; exception when raise_exception then if sqlerrm like 'FAILED:%' then raise; end if; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000104','role','authenticated')::text,true);
select public.complete_lecturer_registration();
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000105','role','authenticated')::text,true);
do $$ begin begin perform public.complete_lecturer_registration(); raise exception 'FAILED: unverified application'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000106','role','authenticated')::text,true);
select public.complete_lecturer_registration();
select pg_temp.assert_true(exists(select 1 from public.staff_profiles where id=auth.uid() and status='active'),'existing lecturer keeps access');
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000107','role','authenticated')::text,true);
select pg_temp.assert_true(public.active_student_stream()='BENG24COE-1','student class access is unchanged');
do $$ begin begin perform public.complete_lecturer_registration(); raise exception 'FAILED: student promoted to lecturer'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000108','role','authenticated')::text,true);
select pg_temp.assert_true(public.is_staff() and public.my_staff_role()='class_rep' and public.staff_material_scope('BENG24COE-1','mod-web'),'CR permissions in own class are unchanged');
select pg_temp.assert_true(not public.staff_material_scope('BENG24COE-2','mod-web'),'CR stays scoped to own class');

-- An administrator with only a password cannot use privileged data or approve lecturers.
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000101','role','authenticated','session_id','00000000-0000-4000-8000-000000000201','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now())::bigint)))::text,true);
select pg_temp.assert_true(not public.admin_email_verified(),'password alone is not verified');
select pg_temp.assert_true(not public.is_admin(),'administrator helper denies password-only session');
select pg_temp.assert_true(public.active_student_stream() is null,'administrator cannot bypass verification using an old student profile');
select pg_temp.assert_true((select count(*)=0 from public.materials),'restrictive table policy blocks unverified admin');
select pg_temp.assert_true((select count(*)=0 from storage.objects),'restrictive storage policy blocks unverified admin');
select pg_temp.assert_true((select count(*)=1 from public.staff_profiles),'unverified admin can read only own membership');
do $$ begin
 begin perform public.list_staff_students(); raise exception 'FAILED: student export RPC bypass'; exception when insufficient_privilege then null; end;
 begin perform public.add_academic_class('test','Test','DIT','BENG24COE',3,1); raise exception 'FAILED: class creation RPC bypass'; exception when insufficient_privilege then null; end;
 begin perform public.archive_academic_class('BENG24COE-1'); raise exception 'FAILED: class archival RPC bypass'; exception when insufficient_privilege then null; end;
 begin perform public.review_lecturer_application('00000000-0000-4000-8000-000000000103','approve'); raise exception 'FAILED: unverified admin approval'; exception when insufficient_privilege then null; end;
 begin perform count(*) from private.admin_trusted_browsers; raise exception 'FAILED: browser tokens readable'; exception when insufficient_privilege then null; end;
end $$;
select pg_temp.assert_true((public.start_admin_email_check(repeat('a',64),'')->>'sent')='true','password proof creates email challenge');
select pg_temp.assert_true(public.start_admin_email_check(repeat('c',64),'') ? 'error','resend rate limit');
select pg_temp.assert_true(public.admin_email_attempt(repeat('a',64)),'first verification attempt');
do $$ begin
 begin perform public.finish_admin_email_check(repeat('a',64),repeat('b',64)); raise exception 'FAILED: password-only finalization'; exception when insufficient_privilege then null; end;
 begin perform public.finish_admin_email_check(repeat('c',64),''); raise exception 'FAILED: wrong challenge'; exception when insufficient_privilege then null; end;
end $$;
select public.admin_email_attempt(repeat('a',64));
select public.admin_email_attempt(repeat('a',64));
select public.admin_email_attempt(repeat('a',64));
select public.admin_email_attempt(repeat('a',64));
select pg_temp.assert_true(not public.admin_email_attempt(repeat('a',64)),'maximum five attempts');
select pg_temp.assert_true(public.start_admin_email_check(repeat('d',64),'') ? 'error','resend cannot reset exhausted attempts');

-- A valid email OTP creates a different session; verification binds it to this user's password challenge.
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000101','role','authenticated','session_id','00000000-0000-4000-8000-000000000202','amr',jsonb_build_array(jsonb_build_object('method','otp','timestamp',extract(epoch from now()-interval '20 minutes')::bigint)))::text,true);
do $$ begin begin perform public.finish_admin_email_check(repeat('a',64),''); raise exception 'FAILED: stale OTP'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000101','role','authenticated','session_id','00000000-0000-4000-8000-000000000202','amr',jsonb_build_array(jsonb_build_object('method','otp','timestamp',extract(epoch from now())::bigint)))::text,true);
reset role;
delete from auth.sessions where id='00000000-0000-4000-8000-000000000201';
set local role authenticated;
select public.finish_admin_email_check(repeat('a',64),repeat('b',64));
select pg_temp.assert_true(public.admin_email_verified(),'password plus current email OTP grants verified session');
select pg_temp.assert_true(public.is_admin(),'verified admin retains admin permissions');
select pg_temp.assert_true((select count(*)=1 from public.materials),'verified admin can read permitted material');
select pg_temp.assert_true((select count(*)=1 from storage.objects),'verified admin can read permitted object');
select public.review_lecturer_application('00000000-0000-4000-8000-000000000103','approve');
select public.review_lecturer_application('00000000-0000-4000-8000-000000000104','reject');
do $$ begin
 begin perform public.review_lecturer_application('00000000-0000-4000-8000-000000000103','reject'); raise exception 'FAILED: duplicate review'; exception when raise_exception then if sqlerrm like 'FAILED:%' then raise; end if; end;
 begin perform public.finish_admin_email_check(repeat('a',64),''); raise exception 'FAILED: replayed challenge'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000103','role','authenticated')::text,true);
select pg_temp.assert_true((public.lecturer_application_status()->>'status')='approved','admin approval changes lecturer status');
select public.complete_lecturer_setup(array['BENG24COE-1'],array['mod-web']);
select pg_temp.assert_true(public.is_staff() and public.staff_material_scope('BENG24COE-1','mod-web'),'approved lecturer retains assigned access');
select pg_temp.assert_true(not public.staff_material_scope('BENG24COE-2','mod-web') and not public.staff_material_scope('BENG24COE-1','mod-numerical'),'lecturer remains scoped to assigned classes and modules');
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000104','role','authenticated')::text,true);
select public.complete_lecturer_registration();
select pg_temp.assert_true((public.lecturer_application_status()->>'status')='rejected','re-registering cannot bypass rejection');
do $$ begin begin perform public.complete_lecturer_setup(array['BENG24COE-1'],array['mod-web']); raise exception 'FAILED: rejected lecturer setup'; exception when insufficient_privilege then null; end; end $$;

-- Browser tokens are account-bound, do not bypass the password, and can be revoked.
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000102','role','authenticated','session_id','00000000-0000-4000-8000-000000000204','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now())::bigint)))::text,true);
select pg_temp.assert_true((public.start_admin_email_check(repeat('e',64),repeat('b',64))->>'sent')='true','browser token cannot cross accounts');
select pg_temp.assert_true(not public.admin_email_verified(),'other administrator remains unverified');
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000101','role','authenticated','session_id','00000000-0000-4000-8000-000000000203','amr',jsonb_build_array(jsonb_build_object('method','otp','timestamp',extract(epoch from now())::bigint)))::text,true);
select pg_temp.assert_true((public.start_admin_email_check(repeat('f',64),repeat('b',64))->>'restart')='true','trusted browser still requires password');
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000101','role','authenticated','session_id','00000000-0000-4000-8000-000000000203','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now())::bigint)))::text,true);
select pg_temp.assert_true((public.start_admin_email_check(repeat('f',64),repeat('b',64))->>'verified')='true','trusted browser recognizes same administrator after password');
reset role;
delete from private.admin_verified_sessions where session_id='00000000-0000-4000-8000-000000000203';
update private.admin_trusted_browsers set expires_at=now()-interval '1 second' where user_id='00000000-0000-4000-8000-000000000101';
set local role authenticated;
select pg_temp.assert_true((public.start_admin_email_check(repeat('f',64),repeat('b',64))->>'sent')='true','expired browser requires a new email code');
select public.forget_admin_browser(repeat('b',64));
select pg_temp.assert_true(not public.admin_email_verified(),'forget browser revokes current approval');
reset role;
select pg_temp.assert_true(not exists(select 1 from private.admin_trusted_browsers where user_id='00000000-0000-4000-8000-000000000101'),'forget removes hashed browser token');
delete from auth.sessions where id='00000000-0000-4000-8000-000000000202';
select pg_temp.assert_true(not exists(select 1 from private.admin_verified_sessions where session_id='00000000-0000-4000-8000-000000000202'),'session revocation cascades');
select 'Passed administrator password/email step-up, RPC and RLS enforcement, attempt limits, stale/replayed proofs, trusted-browser binding/revocation and lecturer approval gates' as result;
rollback;
