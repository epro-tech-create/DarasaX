-- Run inside a transaction, after the admission migration. All fixtures roll back.
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('00000000-0000-0000-0000-00000000ad01','approval-one@example.invalid',now(),'{"full_name":"Approval test one"}'),
('00000000-0000-0000-0000-00000000ad02','approval-two@example.invalid',now(),'{"full_name":"Approval test two"}'),
('00000000-0000-0000-0000-00000000ad03','approval-cr@example.invalid',now(),'{}'),
('00000000-0000-0000-0000-00000000ad04','approval-admin@example.invalid',now(),'{}');
insert into public.staff_profiles(id,role,stream_id,status) values
('00000000-0000-0000-0000-00000000ad03','class_rep','BENG24COE-4','active'),
('00000000-0000-0000-0000-00000000ad04','admin',null,'active');
insert into public.materials(id,title,kind,stream_id,file_path,status) values
('admission-test-material','Approval test','notes','BENG24COE-4','BENG24COE-4/admission-test-material/file.pdf','published');
insert into public.material_shares(token,material_id) values
('00000000-0000-0000-0000-00000000ad99','admission-test-material');
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad01',true);
select public.submit_student_registration('2300000000000000000000000000000000000000001','BENG24COE-4');
do $$ begin
  if public.active_student_stream() is not null then raise exception 'Pending student has access'; end if;
  if exists(select 1 from public.materials where id='admission-test-material') then raise exception 'Pending student reads materials'; end if;
  if public.get_shared_material('00000000-0000-0000-0000-00000000ad99') is not null then raise exception 'Pending share access'; end if;
  begin update public.student_admissions set status='approved' where user_id=auth.uid(); raise exception 'Direct self approval allowed'; exception when insufficient_privilege then null; end;
  begin perform public.review_student_registration(auth.uid(),'approved'); raise exception 'Student RPC approval allowed'; exception when insufficient_privilege then null; end;
  begin perform public.submit_student_registration('24A123','BENG24COE-4'); raise exception 'Letters accepted'; exception when raise_exception then if sqlerrm='Letters accepted' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad02',true);
do $$ begin
  begin perform public.submit_student_registration('2300000000000000000000000000000000000000001','BENG24COE-2'); raise exception 'Duplicate allowed'; exception when unique_violation then null; end;
end $$;
select public.submit_student_registration('2500000000000000000000000000000000000000002','BENG24COE-2');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad03',true);
do $$ begin
  if exists(select 1 from jsonb_array_elements(public.list_student_registrations()) r where r->>'class_name'<>'BENG24COE-4') then raise exception 'CR listing outside class'; end if;
  begin perform public.review_student_registration('00000000-0000-0000-0000-00000000ad02','approved'); raise exception 'CR approved another class'; exception when insufficient_privilege then null; end;
end $$;
select public.review_student_registration('00000000-0000-0000-0000-00000000ad01','approved');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad01',true);
do $$ begin
  if public.active_student_stream()<>'BENG24COE-4' then raise exception 'Approved student denied'; end if;
  if not exists(select 1 from public.materials where id='admission-test-material') then raise exception 'Approved material denied'; end if;
  if public.get_shared_material('00000000-0000-0000-0000-00000000ad99') is null then raise exception 'Approved share denied'; end if;
  if exists(select 1 from public.student_admissions where user_id=auth.uid() and welcome_seen_at is not null) then raise exception 'Welcome already acknowledged'; end if;
end $$;
select public.acknowledge_student_welcome();
do $$ begin
  if not exists(select 1 from public.student_admissions where user_id=auth.uid() and welcome_seen_at is not null) then raise exception 'Welcome not persisted'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad04',true);
select public.review_student_registration('00000000-0000-0000-0000-00000000ad02','approved');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad02',true);
do $$ begin
  if public.get_shared_material('00000000-0000-0000-0000-00000000ad99') is not null then raise exception 'Cross-class shared access'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad03',true);
select public.review_student_registration('00000000-0000-0000-0000-00000000ad01','suspended');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad01',true);
do $$ begin
  if public.active_student_stream() is not null then raise exception 'Suspended student access'; end if;
  if public.get_shared_material('00000000-0000-0000-0000-00000000ad99') is not null then raise exception 'Suspended shared access'; end if;
end $$;
reset role;
do $$ begin
  if has_function_privilege('anon','public.get_shared_material(uuid)','execute') then raise exception 'Anonymous share RPC allowed'; end if;
  if has_function_privilege('anon','public.review_student_registration(uuid,text)','execute') then raise exception 'Anonymous approval allowed'; end if;
  if exists(select 1 from pg_policies where schemaname='storage' and policyname='Share token grants access to one published file') then raise exception 'Anonymous storage policy remains'; end if;
end $$;
select 'PASS: registration uniqueness, CR scope, pending/approved/suspended RLS, private sharing, welcome persistence' as result;
