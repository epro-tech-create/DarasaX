-- Run after student-admission.sql inside the same rollback-only transaction.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad04',true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values ('00000000-0000-0000-0000-00000000ad08','directory-lecturer@example.invalid',now(),'{}');
insert into public.staff_profiles(id,role,status,stream_id,stream_ids) values('00000000-0000-0000-0000-00000000ad08','lecturer','active','BENG24COE-4',array['BENG24COE-4','BENG24COE-2']);
insert into public.monitored_students(id,name,email,stream_id,year) values('directory-legacy-test','Legacy test','legacy@example.invalid','BENG24COE-4',3);
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad03',true);
do $$ declare rows jsonb:=public.list_staff_students(); begin
 if exists(select 1 from jsonb_array_elements(rows) r where r->>'stream_id'<>'BENG24COE-4') then raise exception 'CR directory outside class'; end if;
 if not exists(select 1 from jsonb_array_elements(rows) r where r->>'id'='00000000-0000-0000-0000-00000000ad01' and r->>'registration_number'='2300000000000000000000000000000000000000001') then raise exception 'Registration number missing or truncated'; end if;
 if not exists(select 1 from jsonb_array_elements(rows) r where r->>'id'='directory-legacy-test' and r->>'registration_number' is null) then raise exception 'Legacy registration invented'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad08',true);
do $$ declare rows jsonb:=public.list_staff_students(); begin
 if exists(select 1 from jsonb_array_elements(rows) r where r->>'stream_id' not in ('BENG24COE-4','BENG24COE-2')) then raise exception 'Lecturer outside teaching classes'; end if;
 if not exists(select 1 from jsonb_array_elements(rows) r where r->>'id'='00000000-0000-0000-0000-00000000ad02') then raise exception 'Second teaching class missing'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad04',true);
update public.staff_profiles set stream_ids=array['BENG24COE-2'] where id='00000000-0000-0000-0000-00000000ad08';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad08',true);
do $$ begin
 if exists(select 1 from jsonb_array_elements(public.list_staff_students()) r where r->>'stream_id'<>'BENG24COE-2') then raise exception 'Stale primary class widened teaching scope'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad04',true);
do $$ declare rows jsonb:=public.list_staff_students(); begin
 if not exists(select 1 from jsonb_array_elements(rows) r where r->>'id'='00000000-0000-0000-0000-00000000ad01') or not exists(select 1 from jsonb_array_elements(rows) r where r->>'id'='00000000-0000-0000-0000-00000000ad02') then raise exception 'Admin missing classes'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad01',true);
do $$ begin begin perform public.list_staff_students(); raise exception 'Student read staff directory'; exception when insufficient_privilege then null; end; end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad04',true);
update public.staff_profiles set status='inactive' where id='00000000-0000-0000-0000-00000000ad08';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad08',true);
do $$ begin begin perform public.list_staff_students(); raise exception 'Inactive staff read directory'; exception when insufficient_privilege then null; end; end $$;
reset role;
do $$ begin if has_function_privilege('anon','public.list_staff_students()','execute') then raise exception 'Anonymous directory access'; end if; end $$;
select 'PASS: CR class scope, lecturer teaching classes, admin scope, exact registration values, legacy blanks and inactive/student/anonymous denial' as result;
