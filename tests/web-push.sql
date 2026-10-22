-- Run against the migration in a rollback-only transaction. Never invokes HTTP or delivers push.
begin;
do $$
declare u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); device uuid; other_device uuid; n uuid;
 topic text:='push-test-'||gen_random_uuid(); jobs jsonb; lesson text:='push-lesson-'||gen_random_uuid();
begin
 insert into auth.users(id,email,email_confirmed_at,created_at,updated_at,raw_user_meta_data)
 values(u,'push-'||u||'@example.invalid',now(),now(),now(),'{}'),(other_user,'push-'||other_user||'@example.invalid',now(),now(),now(),'{}');
 update public.student_admissions set status='approved',registration_number=repeat('9',60)||case when user_id=u then '1' else '2' end where user_id in(u,other_user);
 update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,class_name='BENG24COE-1',onboarding_completed=true where id in(u,other_user);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 device:=(public.register_push_subscription('https://fcm.googleapis.com/push-test-'||u,repeat('A',87),repeat('B',22),'https://www.darasax.com')->>'id')::uuid;
 if public.get_push_device('https://fcm.googleapis.com/push-test-'||u) is null then raise exception 'Own device not visible'; end if;
 begin perform public.register_push_subscription('https://127.0.0.1/private',repeat('A',87),repeat('B',22),'https://www.darasax.com'); raise exception 'SSRF accepted'; exception when others then if sqlerrm='SSRF accepted' then raise; end if; end;
 insert into public.module_topics(id,module_id,number,title,published) values(topic,'mod-numerical',1900000010,'Push topic fixture',true);
 select id into n from public.notifications where recipient_id=u and source_id=topic;
 if n is null or (select count(*) from private.push_deliveries where subscription_id=device and notification_id=n)<>1 then raise exception 'Publication not queued exactly once'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',other_user,'role','authenticated')::text,true);
 if public.get_push_device('https://fcm.googleapis.com/push-test-'||u) is not null then raise exception 'Other account device visible'; end if;
 begin perform public.set_push_preferences(device,false,false); raise exception 'Other account preferences changed'; exception when insufficient_privilege then null; end;
 perform public.remove_push_subscription('https://fcm.googleapis.com/push-test-'||u);
 if not exists(select 1 from private.push_subscriptions where id=device) then raise exception 'Other account deleted device'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 begin perform public.claim_push_deliveries(); raise exception 'Worker RPC exposed'; exception when insufficient_privilege then null; end;
 perform public.enqueue_push_test(device);
 begin perform public.enqueue_push_test(device); raise exception 'Test rate limit missing'; exception when others then if sqlerrm='Test rate limit missing' then raise; end if; end;
 perform public.set_push_preferences(device,false,true);
 if exists(select 1 from private.push_deliveries where subscription_id=device and notification_id is not null) then raise exception 'Opt-out did not cancel content'; end if;
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 jobs:=public.claim_push_deliveries(u);
 if jsonb_array_length(jobs)<>1 then raise exception 'Expected exactly one test job'; end if;
 if jsonb_array_length(public.claim_push_deliveries(u))<>0 then raise exception 'Lease failed'; end if;
 perform public.finish_push_delivery((jobs->0->>'id')::bigint,1,'retry','503');
 update private.push_deliveries set available_at=now()-interval '1 second' where subscription_id=device;
 jobs:=public.claim_push_deliveries(u);
 if (jobs->0->>'attempts')::int<>2 then raise exception 'Retry failed'; end if;
 perform public.finish_push_delivery((jobs->0->>'id')::bigint,1,'sent');
 if exists(select 1 from private.push_deliveries where subscription_id=device and state='sent') then raise exception 'Stale lease accepted'; end if;
 perform public.finish_push_delivery((jobs->0->>'id')::bigint,2,'sent');
 if extract(isodow from now() at time zone 'Africa/Dar_es_Salaam')<=5 then
 insert into public.timetable_entries(id,stream_id,module_id,day,start_time,end_time,room,lecturer)
 values(lesson,'BENG24COE-1','mod-numerical',extract(isodow from now() at time zone 'Africa/Dar_es_Salaam'),to_char((now()+interval '9 minutes') at time zone 'Africa/Dar_es_Salaam','HH24:MI'),to_char((now()+interval '69 minutes') at time zone 'Africa/Dar_es_Salaam','HH24:MI'),'Test room','Test lecturer');
 perform public.enqueue_lesson_push(); perform public.enqueue_lesson_push();
 if (select count(*) from private.push_deliveries where subscription_id=device and lesson_id=lesson)<>1 then raise exception 'Lesson not queued exactly once'; end if;
 update public.profiles set class_name='BENG24COE-2' where id=u;
 if jsonb_array_length(public.claim_push_deliveries(u))<>0 then raise exception 'Old class reminder delivered'; end if;
 end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 perform public.remove_push_subscription('https://fcm.googleapis.com/push-test-'||u);
 if exists(select 1 from private.push_deliveries where subscription_id=device) then raise exception 'Device deletion did not cancel queued jobs'; end if;
 if has_function_privilege('anon','public.register_push_subscription(text,text,text,text)','execute') or has_function_privilege('authenticated','public.push_worker_config()','execute') then raise exception 'Public worker/config grant'; end if;
end; $$;
rollback;
