-- No historical backfill. All credentials remain in Vault; private tables have no browser grants.
begin;
create schema if not exists private;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create table private.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique, p256dh text not null, auth text not null,
 origin text not null, updates boolean not null default true, lessons boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 last_test_at timestamptz
);
create index push_subscriptions_user on private.push_subscriptions(user_id);
alter table private.push_subscriptions enable row level security;
create table private.push_deliveries (
 id bigint generated always as identity primary key,
 subscription_id uuid not null references private.push_subscriptions(id) on delete cascade,
 notification_id uuid references public.notifications(id) on delete cascade,
 lesson_id text references public.timetable_entries(id) on delete cascade,
 lesson_start timestamptz,
 event_key text not null, payload jsonb not null,
 state text not null default 'pending' check(state in ('pending','processing','sent','failed')),
 attempts int not null default 0, available_at timestamptz not null default now(),
 expires_at timestamptz not null, created_at timestamptz not null default now(),
 last_error text, unique(subscription_id,event_key)
);
create index push_deliveries_due on private.push_deliveries(available_at) where state in ('pending','processing');
alter table private.push_deliveries enable row level security;
revoke all on private.push_subscriptions, private.push_deliveries from public,anon,authenticated;

create function private.push_eligible(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff_profiles s where s.id=target and s.status='active')
 or exists(select 1 from public.profiles p
 join public.student_admissions a on a.user_id=p.id and a.status='approved'
 join public.academic_classes c on c.id=p.class_name and not c.archived
 where p.id=target and p.onboarding_completed and p.institution='Dar es Salaam Institute of Technology (DIT)'
 and p.programme='BENG24COE' and p.year_of_study=3 and p.semester=1
 and c.institution=p.institution and c.programme=p.programme and c.year=p.year_of_study and c.semester=p.semester
 and not exists(select 1 from public.staff_profiles s where s.id=target and s.status<>'active'));
$$;

create function public.get_push_public_key() returns text language sql stable security definer set search_path='' as $$
 select decrypted_secret from vault.decrypted_secrets where name='darasax_push_public_key' and auth.uid() is not null;
$$;
create function public.get_push_device(push_endpoint text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',id,'updates',updates,'lessons',lessons) from private.push_subscriptions where user_id=auth.uid() and endpoint=push_endpoint;
$$;
create function public.register_push_subscription(push_endpoint text,push_p256dh text,push_auth text,push_origin text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare device private.push_subscriptions;
begin
 if auth.uid() is null or not private.push_eligible(auth.uid()) then raise insufficient_privilege using message='Workspace access required'; end if;
 if length(push_endpoint)>2048 or push_endpoint !~ '^https://(fcm\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)/'
 or push_p256dh !~ '^[A-Za-z0-9_-]{87}$' or push_auth !~ '^[A-Za-z0-9_-]{22}$'
 or push_origin !~ '^https://(www\.|admin\.|cr\.|lecturer\.)?darasax\.com$' then raise exception 'Invalid push subscription'; end if;
 if (select count(*) from private.push_subscriptions where user_id=auth.uid())>=10
 and not exists(select 1 from private.push_subscriptions where user_id=auth.uid() and endpoint=push_endpoint) then raise exception 'Device limit reached'; end if;
 -- The endpoint and encryption keys together are a browser-held capability. Rebinding a shared device cancels the previous account's queue.
 delete from private.push_subscriptions where endpoint=push_endpoint and user_id<>auth.uid() and p256dh=push_p256dh and auth=push_auth;
 insert into private.push_subscriptions(user_id,endpoint,p256dh,auth,origin)
 values(auth.uid(),push_endpoint,push_p256dh,push_auth,push_origin)
 on conflict(endpoint) do update set updated_at=now(),origin=excluded.origin
 where private.push_subscriptions.user_id=auth.uid()
 returning * into device;
 if device.id is null then raise insufficient_privilege using message='Subscription belongs to a different device'; end if;
 return jsonb_build_object('id',device.id,'updates',device.updates,'lessons',device.lessons);
end; $$;
create function public.remove_push_subscription(push_endpoint text) returns void language sql security definer set search_path='' as $$
 delete from private.push_subscriptions where user_id=auth.uid() and endpoint=push_endpoint;
$$;
create function public.set_push_preferences(device_id uuid,receive_updates boolean,lesson_reminders boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 update private.push_subscriptions set updates=receive_updates,lessons=lesson_reminders,updated_at=now() where id=device_id and user_id=auth.uid();
 if not found then raise insufficient_privilege using message='Device not found'; end if;
 delete from private.push_deliveries where subscription_id=device_id and state in ('pending','processing')
 and ((not receive_updates and notification_id is not null) or (not lesson_reminders and lesson_id is not null));
end; $$;

create function private.queue_notification_push() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.push_deliveries(subscription_id,notification_id,event_key,payload,expires_at)
 select s.id,new.id,'notification:'||new.id,
 jsonb_build_object('title','DarasaX · '||new.title,'body',left(new.body,220)||' · Tap to view.', 'href',new.href,'tag','update:'||new.id,'timestamp',extract(epoch from new.created_at)*1000),now()+interval '6 hours'
 from private.push_subscriptions s where s.user_id=new.recipient_id and s.updates and private.push_eligible(s.user_id)
 on conflict do nothing;
 return new;
end; $$;
create trigger queue_web_push after insert on public.notifications for each row execute function private.queue_notification_push();

-- Service role only. Browser clients cannot read keys, claim jobs, or send to other users.
create function public.push_worker_config() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_object_agg(replace(name,'darasax_push_',''),decrypted_secret) from vault.decrypted_secrets
 where name in ('darasax_push_public_key','darasax_push_private_key','darasax_push_worker_secret') and auth.role()='service_role';
$$;

create function public.enqueue_push_test(device_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.push_eligible(auth.uid()) then raise insufficient_privilege; end if;
 update private.push_subscriptions set last_test_at=now() where id=device_id and user_id=auth.uid() and (last_test_at is null or last_test_at<now()-interval '1 minute');
 if not found then raise exception 'Wait one minute before sending another test'; end if;
 insert into private.push_deliveries(subscription_id,event_key,payload,expires_at) values(device_id,'test:'||gen_random_uuid(),
 jsonb_build_object('title','DarasaX · You’re connected','body','Phone notifications are ready. Announcements, assignments, learning updates, and class reminders will appear here.','href','/dashboard','tag','darasax-test'),now()+interval '5 minutes');
end; $$;

create function public.enqueue_lesson_push() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise insufficient_privilege; end if;
 insert into private.push_deliveries(subscription_id,lesson_id,lesson_start,event_key,payload,expires_at)
 select s.id,t.id,occ.start_at,'lesson:'||t.id||':'||occ.start_at,
 jsonb_build_object('title','DarasaX · Class in 10 minutes','body',t.module_id||' · '||t.start_time||'–'||t.end_time||' EAT · '||coalesce(nullif(t.room,''),'Room to be confirmed'),'href','/timetable','tag','lesson:'||t.id),occ.start_at
 from public.timetable_entries t
 cross join lateral(select (((now() at time zone 'Africa/Dar_es_Salaam')::date + t.start_time::time) at time zone 'Africa/Dar_es_Salaam') start_at) occ
 join private.push_subscriptions s on s.lessons
 join public.profiles p on p.id=s.user_id
 left join public.staff_profiles staff on staff.id=s.user_id
 where t.day=extract(isodow from now() at time zone 'Africa/Dar_es_Salaam')
 and occ.start_at>now()+interval '8 minutes' and occ.start_at<=now()+interval '10 minutes'
 and private.push_eligible(s.user_id)
 and ((staff.id is null and p.class_name=t.stream_id) or (staff.status='active' and ((staff.role='class_rep' and staff.stream_id=t.stream_id)
 or (staff.role='lecturer' and t.stream_id=any(staff.stream_ids) and t.module_id=any(staff.module_ids)))))
 on conflict do nothing;
 -- Bound delivery history without deleting the user's in-app notifications.
 delete from private.push_deliveries where expires_at<now()-interval '7 days';
end; $$;

create function private.push_delivery_allowed(job private.push_deliveries,device private.push_subscriptions) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare n public.notifications; m public.materials; t public.timetable_entries; p public.profiles; staff public.staff_profiles;
begin
 if not private.push_eligible(device.user_id) then return false; end if;
 select * into p from public.profiles where id=device.user_id;
 select * into staff from public.staff_profiles where id=device.user_id and status='active';
 if job.lesson_id is not null then
  select * into t from public.timetable_entries where id=job.lesson_id;
  return device.lessons and t.id is not null
   and t.day=extract(isodow from job.lesson_start at time zone 'Africa/Dar_es_Salaam')
   and t.start_time::time=(job.lesson_start at time zone 'Africa/Dar_es_Salaam')::time
   and ((staff.id is null and p.class_name=t.stream_id) or (staff.role='class_rep' and staff.stream_id=t.stream_id)
   or (staff.role='lecturer' and t.stream_id=any(staff.stream_ids) and t.module_id=any(staff.module_ids)));
 end if;
 if job.notification_id is null then return true; end if;
 if not device.updates then return false; end if;
 select * into n from public.notifications where id=job.notification_id and recipient_id=device.user_id;
 if n.id is null or n.read_at is not null then return false; end if;
 if n.source_type='topic' then return exists(select 1 from public.module_topics where id=n.source_id and published); end if;
 select * into m from public.materials where id=n.source_id and status='published';
 if m.id is null then return false; end if;
 return (staff.id is null and (m.stream_id is null or m.stream_id=p.class_name) and m.programme=p.programme and m.year_of_study=p.year_of_study and m.semester=p.semester)
 or staff.role='admin' or (staff.role='class_rep' and (m.stream_id is null or staff.stream_id=m.stream_id))
 or (staff.role='lecturer' and (m.stream_id is null or m.stream_id=any(staff.stream_ids)) and (m.module_id is null or m.module_id=any(staff.module_ids)));
end; $$;

create function public.claim_push_deliveries(only_user uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role()<>'service_role' then raise insufficient_privilege; end if;
 with candidates as (
  select d.id from private.push_deliveries d join private.push_subscriptions s on s.id=d.subscription_id
  where d.state in ('pending','processing') and d.available_at<=now() and d.expires_at>now() and d.attempts<4
  and (only_user is null or s.user_id=only_user)
  and private.push_delivery_allowed(d,s)
  order by d.available_at,d.id for update of d skip locked limit 60
 ), claimed as (
  update private.push_deliveries d set state='processing',available_at=now()+interval '2 minutes',attempts=attempts+1
  from candidates c where d.id=c.id returning d.*
 ) select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'attempts',c.attempts,'expiresAt',c.expires_at,'payload',c.payload,
 'endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth,'origin',s.origin,'deviceId',s.id)), '[]'::jsonb) into result
 from claimed c join private.push_subscriptions s on s.id=c.subscription_id;
 return result;
end; $$;

create function public.finish_push_delivery(delivery_id bigint,delivery_attempt int,outcome text,error_code text default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise insufficient_privilege; end if;
 if outcome='expired' then
  delete from private.push_subscriptions where id=(select subscription_id from private.push_deliveries where id=delivery_id and attempts=delivery_attempt and state='processing');
 else
  update private.push_deliveries set state=case when outcome='sent' then 'sent' when outcome='retry' and attempts<4 then 'pending' else 'failed' end,
  available_at=now()+make_interval(secs=>least(1800,30*power(2,attempts)::int)),last_error=left(error_code,80)
  where id=delivery_id and attempts=delivery_attempt and state='processing';
 end if;
end; $$;

revoke all on function private.push_eligible(uuid),private.queue_notification_push(),private.push_delivery_allowed(private.push_deliveries,private.push_subscriptions) from public,anon,authenticated;
revoke all on function public.get_push_public_key(),public.get_push_device(text),public.register_push_subscription(text,text,text,text),public.remove_push_subscription(text),public.set_push_preferences(uuid,boolean,boolean),public.enqueue_push_test(uuid) from public,anon;
grant execute on function public.get_push_public_key(),public.get_push_device(text),public.register_push_subscription(text,text,text,text),public.remove_push_subscription(text),public.set_push_preferences(uuid,boolean,boolean),public.enqueue_push_test(uuid) to authenticated;
revoke all on function public.push_worker_config(),public.enqueue_lesson_push(),public.claim_push_deliveries(uuid),public.finish_push_delivery(bigint,int,text,text) from public,anon,authenticated;
grant execute on function public.push_worker_config(),public.enqueue_lesson_push(),public.claim_push_deliveries(uuid),public.finish_push_delivery(bigint,int,text,text) to service_role;
commit;
