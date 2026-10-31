-- Rollback-only integration test. No real messages or accounts are retained.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAILED: %', label; end if; end; $$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('fe000000-0000-4000-8000-000000000001','helpdesk-test-one@example.invalid',now(),'{}'),
('fe000000-0000-4000-8000-000000000002','helpdesk-test-two@example.invalid',now(),'{}');
select set_config('test.helpdesk_admin',(select id::text from public.staff_profiles where role='admin' and status='active' limit 1),true);
-- Only this transaction sees the disabled step-up requirement.
update private.admin_security_policy set enabled=false;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"fe000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.helpdesk_requests(user_id,sender_name,category,subject,message)
values(auth.uid(),'Test user','review','Helpdesk test','Private review');
select pg_temp.assert_true((select count(*)=1 from public.helpdesk_requests),'owner can read their submission');
do $$ begin
 begin
  insert into public.helpdesk_requests(user_id,sender_name,category,subject,message)
  values('fe000000-0000-4000-8000-000000000002','Spoof','question','Spoof','Spoof');
  raise exception 'FAILED: spoofed owner accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.helpdesk_requests(user_id,sender_name,category,subject,message,admin_reply)
  values(auth.uid(),'Spoof','question','Spoof','Spoof','Fake admin reply');
  raise exception 'FAILED: forged reply accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.helpdesk_requests(user_id,sender_name,category,subject,message)
  values(auth.uid(),'User','question','Valid','   ');
  raise exception 'FAILED: whitespace message accepted';
 exception when check_violation then null; end;
 update public.helpdesk_requests set admin_reply='Fake response',status='resolved';
 if found then raise exception 'FAILED: student updated response'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"fe000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select pg_temp.assert_true((select count(*)=0 from public.helpdesk_requests),'other user cannot read private review');
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.helpdesk_admin'),'role','authenticated')::text,true);
select pg_temp.assert_true(public.is_admin(),'admin fixture authorized');
select pg_temp.assert_true(exists(select 1 from public.helpdesk_requests where subject='Helpdesk test'),'admin inbox includes private requests');
update public.helpdesk_requests set admin_reply='Thanks for your review',status='resolved' where user_id='fe000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"fe000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select pg_temp.assert_true(exists(select 1 from public.helpdesk_requests where admin_reply='Thanks for your review' and status='resolved'),'owner sees admin response and status');
set local role anon;
do $$ begin
 begin perform id from public.helpdesk_requests; raise exception 'FAILED: anonymous reading allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
