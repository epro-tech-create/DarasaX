-- Local synthetic fixture only. All accounts and passwords here are fictional.
insert into auth.users(id,email,email_confirmed_at,last_sign_in_at,encrypted_password,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000801','admin@darasax.app',now(),now(),'unchanged-old','{}'),
 ('00000000-0000-4000-8000-000000000802','allandavinc89@gmail.com',now(),now(),'unchanged-existing','{}'),
 ('00000000-0000-4000-8000-000000000803','eprocreativ12@gmail.com',now(),null,'old-seed-password','{}');
insert into public.staff_profiles(id,email,role,status) values
 ('00000000-0000-4000-8000-000000000801','admin@darasax.app','admin','active');
insert into auth.sessions(id,user_id) values
 ('00000000-0000-4000-8000-000000000810','00000000-0000-4000-8000-000000000801');
insert into private.admin_verified_sessions(session_id,user_id,expires_at) values
 ('00000000-0000-4000-8000-000000000810','00000000-0000-4000-8000-000000000801',now()+interval '1 hour');
insert into private.admin_trusted_browsers(token_hash,user_id,expires_at) values
 ('synthetic','00000000-0000-4000-8000-000000000801',now()+interval '1 hour');

-- APPLY_MIGRATION_HERE

begin;
update private.admin_security_policy set enabled=true;
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAILED: %',label; end if; end; $$;
select pg_temp.assert_true((select status='inactive' from public.staff_profiles where id='00000000-0000-4000-8000-000000000801'),'old administrator disabled');
select pg_temp.assert_true(not exists(select 1 from auth.sessions where user_id='00000000-0000-4000-8000-000000000801'),'old sessions revoked');
select pg_temp.assert_true(not exists(select 1 from private.admin_trusted_browsers where user_id='00000000-0000-4000-8000-000000000801'),'old trusted browsers revoked');
select pg_temp.assert_true((select role='admin' and status='active' from public.staff_profiles where id='00000000-0000-4000-8000-000000000802'),'allan existing verified invitation claimed');
select pg_temp.assert_true((select encrypted_password='unchanged-existing' from auth.users where id='00000000-0000-4000-8000-000000000802'),'allan existing password preserved');

-- eprocreativ12 has password removed and is not bound before first sign in
select pg_temp.assert_true((select encrypted_password is null from auth.users where id='00000000-0000-4000-8000-000000000803'),'epro password removed');
select pg_temp.assert_true(not exists(select 1 from public.staff_profiles where id='00000000-0000-4000-8000-000000000803'),'epro not bound before first sign in');
select pg_temp.assert_true((select user_id is null from private.administrator_invitations where email='eprocreativ12@gmail.com'),'epro invitation unassigned');

-- First sign in binds eprocreativ12
update auth.users set encrypted_password='chosen-by-user',last_sign_in_at=now() where id='00000000-0000-4000-8000-000000000803';
select pg_temp.assert_true((select role='admin' and status='active' from public.staff_profiles where id='00000000-0000-4000-8000-000000000803'),'epro bound on first sign in');
select pg_temp.assert_true((select user_id='00000000-0000-4000-8000-000000000803' from private.administrator_invitations where email='eprocreativ12@gmail.com'),'epro invitation claimed on sign in');

-- Uninvited user cannot get staff access
insert into auth.users(id,email,email_confirmed_at,last_sign_in_at,encrypted_password,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000805','uninvited@example.invalid',now(),now(),'chosen-by-user','{"role":"admin"}');
select pg_temp.assert_true(not exists(select 1 from public.staff_profiles where id='00000000-0000-4000-8000-000000000805'),'metadata does not grant uninvited staff access');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000803","role":"authenticated"}',true);
select pg_temp.assert_true(not public.is_admin(),'email confirmation alone cannot bypass password plus email step-up');
do $$ begin
 begin perform private.claim_administrator_invitation(auth.uid()); raise exception 'FAILED: direct claim callable'; exception when insufficient_privilege then null; end;
 begin perform 1 from private.administrator_invitations; raise exception 'FAILED: invitations exposed'; exception when insufficient_privilege then null; end;
end; $$;
reset role;

update public.staff_profiles set status='inactive' where id='00000000-0000-4000-8000-000000000802';
update auth.users set email_confirmed_at=now() where id='00000000-0000-4000-8000-000000000802';
select pg_temp.assert_true((select status='inactive' from public.staff_profiles where id='00000000-0000-4000-8000-000000000802'),'reconfirmation cannot reactivate disabled membership');

update auth.users set email='changed@example.invalid' where id='00000000-0000-4000-8000-000000000803';
select pg_temp.assert_true((select status='inactive' from public.staff_profiles where id='00000000-0000-4000-8000-000000000803'),'email change revokes invited membership');

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values('00000000-0000-4000-8000-000000000806','eprocreativ12@gmail.com',now(),'{}');
select pg_temp.assert_true(not exists(select 1 from public.staff_profiles where id='00000000-0000-4000-8000-000000000806'),'invitation remains bound to original identity');
rollback;
