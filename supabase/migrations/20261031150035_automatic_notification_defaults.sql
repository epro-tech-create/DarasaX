-- Notifications are automatic for registered devices; browser permission remains mandatory.
create function private.always_enable_push() returns trigger language plpgsql set search_path='' as $$
begin new.updates:=true; new.lessons:=true; return new; end; $$;
revoke all on function private.always_enable_push() from public,anon,authenticated;
create trigger always_enable_push before insert or update on private.push_subscriptions for each row execute function private.always_enable_push();
update private.push_subscriptions set updates=true,lessons=true where not updates or not lessons;
-- Preserve the old RPC for cached clients, but preferences can no longer disable delivery.
create or replace function public.set_push_preferences(device_id uuid,receive_updates boolean,lesson_reminders boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 update private.push_subscriptions set updates=true,lessons=true,updated_at=now() where id=device_id and user_id=auth.uid();
 if not found then raise insufficient_privilege using message='Device not found'; end if;
end; $$;
create or replace function public.register_push_subscription(push_endpoint text,push_p256dh text,push_auth text,push_origin text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare device private.push_subscriptions;
begin
 if auth.uid() is null or not private.push_eligible(auth.uid()) then raise insufficient_privilege using message='Workspace access required'; end if;
 if length(push_endpoint)>2048 or push_endpoint !~ '^https://(fcm\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)/'
 or push_p256dh !~ '^[A-Za-z0-9_-]{87}$' or push_auth !~ '^[A-Za-z0-9_-]{22}$'
 or (push_origin !~ '^https://(www\.|admin\.|cr\.|lecturer\.)?darasax\.com$' and push_origin !~ '^http://(localhost|127\.0\.0\.1):300[5-8]$') then raise exception 'Invalid push subscription'; end if;
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
