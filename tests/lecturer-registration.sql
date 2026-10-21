-- Run against the configured Supabase database; every test account rolls back.
begin;
insert into auth.users(id,email,encrypted_password,email_confirmed_at,raw_user_meta_data,raw_app_meta_data,aud,role) values
('00000000-0000-4000-8000-000000009901','lecturer-report-test@example.invalid','test-hash',now(),'{"full_name":"Report Lecturer"}','{"provider":"email","providers":["email"]}','authenticated','authenticated'),
('00000000-0000-4000-8000-000000009902','lecturer-unverified-test@example.invalid','test-hash',null,'{}','{"provider":"email"}','authenticated','authenticated');
insert into auth.identities(user_id,provider_id,identity_data,provider) values
('00000000-0000-4000-8000-000000009901','00000000-0000-4000-8000-000000009901','{"sub":"00000000-0000-4000-8000-000000009901","email":"lecturer-report-test@example.invalid"}','email');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000009902","role":"authenticated"}',true);
do $$ begin
  begin perform public.complete_lecturer_registration(); raise exception 'TEST FAILED: unverified accepted';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000009901","role":"authenticated"}',true);
select public.complete_lecturer_registration();
select public.complete_lecturer_registration();
do $$ begin
  if not exists(select 1 from public.staff_profiles where id=auth.uid() and role='lecturer' and status='active' and not onboarding_completed) then raise exception 'TEST FAILED: registration'; end if;
  begin update public.staff_profiles set role='admin' where id=auth.uid(); raise exception 'TEST FAILED: escalation';
  exception when raise_exception then if sqlerrm='TEST FAILED: escalation' then raise; end if; end;
  begin perform public.complete_lecturer_setup(array['invalid'],array['mod-web']); raise exception 'TEST FAILED: invalid scope';
  exception when raise_exception then if sqlerrm='TEST FAILED: invalid scope' then raise; end if; end;
end $$;
select public.complete_lecturer_setup(array['BENG24COE-1'],array['mod-web']);
do $$ begin
  if not exists(select 1 from public.staff_profiles where id=auth.uid() and onboarding_completed and stream_ids=array['BENG24COE-1'] and module_ids=array['mod-web']) then raise exception 'TEST FAILED: setup'; end if;
  begin perform public.complete_lecturer_setup(array['BENG24COE-2'],array['mod-web']); raise exception 'TEST FAILED: scope reassignment';
  exception when raise_exception then if sqlerrm='TEST FAILED: scope reassignment' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',(select user_id from public.student_admissions where registration_number is not null limit 1),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  begin perform public.complete_lecturer_registration(); raise exception 'TEST FAILED: student promoted';
  exception when insufficient_privilege then null; end;
end $$;
select 'Passed verified registration, idempotency, unverified rejection, role escalation rejection, invalid class rejection, initial setup, scope reassignment rejection and student rejection' as result;
rollback;
