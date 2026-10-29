-- Rollback-only: fabricated accounts, no subscriptions, no HTTP or phone alerts.
begin;
do $$
declare first_user uuid:=gen_random_uuid(); second_user uuid:=gen_random_uuid(); age_user uuid:=gen_random_uuid(); device uuid;
begin
 insert into auth.users(id,email,created_at,raw_user_meta_data) values
 (first_user,'retention-'||first_user||'@example.invalid',now(),'{}'),
 (second_user,'retention-'||second_user||'@example.invalid',now(),'{}'),
 (age_user,'retention-'||age_user||'@example.invalid',now(),'{}');

 insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href,created_at)
 select first_user,'topic','cap-'||n,'Fixture','Fixture','announcement','/announcements',now()-n*interval '1 minute'
 from generate_series(0,54) n;
 if (select count(*) from public.notifications where recipient_id=first_user)<>50 then raise exception 'Batch insert did not enforce cap'; end if;
 if exists(select 1 from public.notifications where recipient_id=first_user and source_id in ('cap-50','cap-51','cap-52','cap-53','cap-54')) then raise exception 'Oldest notifications retained'; end if;
 insert into private.push_subscriptions(user_id,endpoint,p256dh,auth,origin)
 values(first_user,'https://fcm.googleapis.com/retention-fixture-'||first_user,repeat('A',87),repeat('B',22),'https://www.darasax.com') returning id into device;
 insert into private.push_deliveries(subscription_id,notification_id,event_key,payload,expires_at)
 select device,id,'retention-fixture','{}',now()+interval '1 day' from public.notifications where recipient_id=first_user and source_id='cap-49';

 insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href,created_at)
 select second_user,'topic','other-'||n,'Fixture','Fixture','announcement','/announcements',now()-n*interval '1 minute'
 from generate_series(1,3) n;
 insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href,created_at)
 values(first_user,'topic','newest','Fixture','Fixture','announcement','/announcements',now()+interval '1 minute');
 if (select count(*) from public.notifications where recipient_id=first_user)<>50 then raise exception 'New arrival exceeded cap'; end if;
 if exists(select 1 from public.notifications where recipient_id=first_user and source_id='cap-49') then raise exception 'New arrival did not remove oldest'; end if;
 if exists(select 1 from private.push_deliveries where subscription_id=device) then raise exception 'Removed notification left a queued push'; end if;
 if (select count(*) from public.notifications where recipient_id=second_user)<>3 then raise exception 'Another inbox was affected'; end if;

 -- Equal timestamps still have a deterministic newest-50 ordering.
 insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href,created_at)
 select second_user,'topic','tie-'||n,'Fixture','Fixture','announcement','/announcements',now()+interval '1 day'
 from generate_series(1,55) n;
 if (select count(*) from public.notifications where recipient_id=second_user)<>50 then raise exception 'Tied timestamp cap failed'; end if;
 if exists(select 1 from public.notifications where recipient_id=second_user and source_id like 'other-%') then raise exception 'Older records displaced new tied records'; end if;

 insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href)
 select age_user,'topic',name,'Fixture','Fixture','announcement','/announcements'
 from unnest(array['read-expired','read-kept','unread-expired','unread-kept','old-recently-read','exact-read','exact-unread']) name;
 -- Simulate the passage of time without relying on new inserts for cleanup.
 update public.notifications set created_at=now()-interval '40 days',read_at=now()-interval '31 days' where recipient_id=age_user and source_id='read-expired';
 update public.notifications set created_at=now()-interval '40 days',read_at=now()-interval '29 days' where recipient_id=age_user and source_id='read-kept';
 update public.notifications set created_at=now()-interval '91 days' where recipient_id=age_user and source_id='unread-expired';
 update public.notifications set created_at=now()-interval '89 days' where recipient_id=age_user and source_id='unread-kept';
 update public.notifications set created_at=now()-interval '100 days',read_at=now()-interval '1 day' where recipient_id=age_user and source_id='old-recently-read';
 update public.notifications set created_at=now()-interval '40 days',read_at=now()-interval '30 days' where recipient_id=age_user and source_id='exact-read';
 update public.notifications set created_at=now()-interval '90 days' where recipient_id=age_user and source_id='exact-unread';
 perform private.prune_notifications(array[age_user]);
 if (select count(*) from public.notifications where recipient_id=age_user)<>3 then raise exception 'Age retention failed'; end if;
 if exists(select 1 from public.notifications where recipient_id=age_user and source_id in ('read-expired','unread-expired','exact-read','exact-unread')) then raise exception 'Expired notifications remain'; end if;
 if private.prune_notifications(array[age_user])<>0 then raise exception 'Cleanup is not idempotent'; end if;
 if has_function_privilege('authenticated','private.prune_notifications(uuid[])','execute') or has_function_privilege('anon','private.prune_notifications(uuid[])','execute') then raise exception 'Cleanup exposed to browser'; end if;
 if not exists(select 1 from cron.job where jobname='darasax-notification-retention' and active and schedule='10 * * * *') then raise exception 'Hourly cleanup missing'; end if;
end; $$;
rollback;
