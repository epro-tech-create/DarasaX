begin;
create or replace function public.claim_push_deliveries(only_user uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
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
 'endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth,'origin',s.origin,'deviceId',s.id,'portal',coalesce((select role::text from public.staff_profiles where id=s.user_id and status='active'),'student'))), '[]'::jsonb) into result
 from claimed c join private.push_subscriptions s on s.id=c.subscription_id;
 return result;
end; $$;
commit;
