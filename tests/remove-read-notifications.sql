-- Empty isolated local database only. No remote users or push subscriptions.
create schema private;
create table public.notifications(id uuid primary key default gen_random_uuid(),recipient_id uuid not null,read_at timestamptz,created_at timestamptz not null default now());
insert into public.notifications(id,recipient_id,read_at) values
 ('00000000-0000-4000-8000-000000002001','00000000-0000-4000-8000-000000002101',now()),
 ('00000000-0000-4000-8000-000000002002','00000000-0000-4000-8000-000000002101',null),
 ('00000000-0000-4000-8000-000000002003','00000000-0000-4000-8000-000000002102',null);
\ir ../supabase/migrations/20261102165424_remove_read_notifications.sql
begin;
do $$ begin
 if exists(select 1 from public.notifications where read_at is not null) then raise exception 'Existing read notifications retained'; end if;
 if (select count(*) from public.notifications)<>2 then raise exception 'Unread notification removed by cleanup'; end if;
 insert into public.notifications(id,recipient_id,read_at) values('00000000-0000-4000-8000-000000002004','00000000-0000-4000-8000-000000002101',now());
 if exists(select 1 from public.notifications where id='00000000-0000-4000-8000-000000002004') then raise exception 'Read insert was retained'; end if;
 update public.notifications set read_at=now() where id='00000000-0000-4000-8000-000000002002';
 if exists(select 1 from public.notifications where id='00000000-0000-4000-8000-000000002002') then raise exception 'Mark read did not remove notification'; end if;
 if not exists(select 1 from public.notifications where id='00000000-0000-4000-8000-000000002003' and read_at is null) then raise exception 'Another recipient inbox was changed'; end if;
 insert into public.notifications(id,recipient_id,created_at) values
 ('00000000-0000-4000-8000-000000002005','00000000-0000-4000-8000-000000002102',now()+interval '1 minute');
 update public.notifications set read_at=now() where recipient_id='00000000-0000-4000-8000-000000002102' and read_at is null and created_at<=now();
 if (select count(*) from public.notifications)<>1 or not exists(select 1 from public.notifications where id='00000000-0000-4000-8000-000000002005' and read_at is null) then raise exception 'Mark all read removed a newer unread arrival'; end if;
 if has_function_privilege('authenticated','private.remove_read_notification()','execute') or has_function_privilege('anon','private.remove_read_notification()','execute') then raise exception 'Cleanup trigger callable by clients'; end if;
end; $$;
rollback;
