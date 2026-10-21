-- Run after student-admission.sql in the same rollback-only transaction.
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('00000000-0000-0000-0000-00000000ad05','invite-one@example.invalid',now(),'{}'),
('00000000-0000-0000-0000-00000000ad06','invite-two@example.invalid',now(),'{}'),
('00000000-0000-0000-0000-00000000ad07','invite-unverified@example.invalid',null,'{}');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad03',true);
select set_config('test.invite_code',public.manage_class_invitation('create')->>'code',true);
do $$ begin
 if length(current_setting('test.invite_code'))<>32 then raise exception 'Incorrect code entropy'; end if;
 if public.resolve_class_invitation(current_setting('test.invite_code'))->>'class_name'<>'BENG24COE-4' then raise exception 'Wrong invitation class'; end if;
end $$;
set local role anon;
do $$ begin
 if public.resolve_class_invitation(current_setting('test.invite_code')) is null then raise exception 'Public QR landing denied'; end if;
 if has_function_privilege('anon','public.redeem_class_invitation(text,text)','execute') then raise exception 'Anonymous can redeem'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad07',true);
do $$ begin
 begin perform public.redeem_class_invitation(current_setting('test.invite_code'),'2700000000000000000000000000000000000000007'); raise exception 'Unverified email accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad05',true);
select public.redeem_class_invitation(current_setting('test.invite_code'),'2300000000000000000000000000000000000000005');
do $$ begin
 if public.active_student_stream()<>'BENG24COE-4' then raise exception 'Invite did not approve'; end if;
 if not exists(select 1 from public.student_admissions where user_id=auth.uid() and status='approved' and welcome_seen_at is null) then raise exception 'Missing welcome'; end if;
 begin perform public.manage_class_invitation('create'); raise exception 'Student created invitation'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad06',true);
do $$ begin
 begin perform public.redeem_class_invitation(current_setting('test.invite_code'),'2300000000000000000000000000000000000000005'); raise exception 'Duplicate registration accepted'; exception when unique_violation then null; end;
end $$;
select public.redeem_class_invitation(current_setting('test.invite_code'),'2500000000000000000000000000000000000000006');
do $$ begin if public.active_student_stream()<>'BENG24COE-4' then raise exception 'Invitation not reusable'; end if; end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad01',true);
do $$ begin
 begin perform public.redeem_class_invitation(current_setting('test.invite_code'),'2300000000000000000000000000000000000000001'); raise exception 'Suspension bypassed'; exception when raise_exception then if sqlerrm='Suspension bypassed' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad02',true);
do $$ begin
 begin perform public.redeem_class_invitation(current_setting('test.invite_code'),'2500000000000000000000000000000000000000002'); raise exception 'Existing class switched'; exception when raise_exception then if sqlerrm='Existing class switched' then raise; end if; end;
end $$;
reset role;
update public.class_invitations set expires_at=now()-interval '1 second' where code=current_setting('test.invite_code');
do $$ begin if public.resolve_class_invitation(current_setting('test.invite_code')) is not null then raise exception 'Expired code visible'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad05',true);
do $$ begin
 begin perform public.redeem_class_invitation(current_setting('test.invite_code'),'2300000000000000000000000000000000000000005'); raise exception 'Expired code redeemed'; exception when raise_exception then if sqlerrm='Expired code redeemed' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000ad03',true);
select public.manage_class_invitation('create');
do $$ begin if public.resolve_class_invitation(current_setting('test.invite_code')) is not null then raise exception 'Old code remains active'; end if; end $$;
select set_config('test.invite_code',public.manage_class_invitation('get')->>'code',true);
select public.manage_class_invitation('revoke');
do $$ begin if public.resolve_class_invitation(current_setting('test.invite_code')) is not null then raise exception 'Revoked code visible'; end if; end $$;
reset role;
select 'PASS: CR-only creation, class scope, verified registration, uniqueness, reusable invites, suspension protection, expiry and revocation' as result;
