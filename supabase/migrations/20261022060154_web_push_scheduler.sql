begin;
create or replace function private.dispatch_web_push() returns bigint
language plpgsql security definer set search_path='' as $$
declare worker_secret text; request_id bigint;
begin
 -- Skip idle ticks; the SQL scheduler itself does not invoke an Edge Function
 -- unless deliveries or opted-in lesson reminders need work.
 if not exists(select 1 from private.push_deliveries where state in ('pending','processing') and available_at<=now() and expires_at>now() and attempts<4)
 and not exists(select 1 from private.push_subscriptions where lessons) then return null; end if;
 select decrypted_secret into worker_secret from vault.decrypted_secrets where name='darasax_push_worker_secret';
 if worker_secret is null then return null; end if;
 select net.http_post(url:='https://psrtifnhstkujmschwem.supabase.co/functions/v1/deliver-web-push',
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||worker_secret),
 body:='{}'::jsonb,timeout_milliseconds:=60000) into request_id;
 return request_id;
end; $$;
revoke all on function private.dispatch_web_push() from public,anon,authenticated;
select cron.schedule('darasax-web-push','* * * * *','select private.dispatch_web_push();');
commit;
