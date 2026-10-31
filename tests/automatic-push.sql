-- No push is sent. All fixtures roll back.
begin;
do $$
declare u uuid:=gen_random_uuid(); device uuid;
begin
 insert into auth.users(id,email,email_confirmed_at,created_at,raw_user_meta_data) values(u,'automatic-push-'||u||'@example.invalid',now(),now(),'{}');
 update public.student_admissions set status='approved',registration_number=repeat('8',60)||'771' where user_id=u;
 update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,class_name='BENG24COE-1',onboarding_completed=true where id=u;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 device:=(public.register_push_subscription('https://fcm.googleapis.com/automatic-test-'||u,repeat('A',87),repeat('B',22),'http://localhost:3005')->>'id')::uuid;
 perform public.set_push_preferences(device,false,false);
 if not exists(select 1 from private.push_subscriptions where id=device and updates and lessons) then raise exception 'App preference disabled automatic notifications'; end if;
 update private.push_subscriptions set updates=false,lessons=false where id=device;
 if not exists(select 1 from private.push_subscriptions where id=device and updates and lessons) then raise exception 'Defaults not enforced'; end if;
 perform public.remove_push_subscription('https://fcm.googleapis.com/automatic-test-'||u);
 if exists(select 1 from private.push_subscriptions where id=device) then raise exception 'Explicit signout could not detach device'; end if;
end $$;
rollback;
