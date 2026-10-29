-- Retention is per account, independent of open browsers or phone opt-in.
-- Serialize notification insert statements before they write any rows so
-- simultaneous publications cannot both leave a recipient above the cap.
create function private.lock_notification_retention() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('darasax.notification_retention',0));
 return null;
end; $$;
revoke all on function private.lock_notification_retention() from public,anon,authenticated;

create function private.prune_notifications(recipient_ids uuid[] default null) returns bigint
language plpgsql security definer set search_path='' as $$
declare removed bigint; overflow_removed bigint;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('darasax.notification_retention',0));
 delete from public.notifications n
 where (recipient_ids is null or n.recipient_id=any(recipient_ids))
 and ((n.read_at is not null and n.read_at<=now()-interval '30 days')
   or (n.read_at is null and n.created_at<=now()-interval '90 days'));
 get diagnostics removed = row_count;
 with ranked as (
  select n.id,row_number() over(partition by n.recipient_id order by n.created_at desc,n.id desc) position
  from public.notifications n where recipient_ids is null or n.recipient_id=any(recipient_ids)
 ) delete from public.notifications n using ranked r where n.id=r.id and r.position>50;
 get diagnostics overflow_removed = row_count;
 return removed+overflow_removed;
end; $$;
revoke all on function private.prune_notifications(uuid[]) from public,anon,authenticated;

create function private.prune_inserted_notification_inboxes() returns trigger
language plpgsql security definer set search_path='' as $$
declare recipients uuid[];
begin
 select array_agg(distinct recipient_id) into recipients from inserted_notifications;
 if recipients is not null then perform private.prune_notifications(recipients); end if;
 return null;
end; $$;
revoke all on function private.prune_inserted_notification_inboxes() from public,anon,authenticated;

create trigger notification_retention_lock before insert on public.notifications
for each statement execute function private.lock_notification_retention();
create trigger notification_retention_prune after insert on public.notifications
referencing new table as inserted_notifications
for each statement execute function private.prune_inserted_notification_inboxes();

create index notifications_read_retention_idx on public.notifications(read_at) where read_at is not null;
create index notifications_unread_retention_idx on public.notifications(created_at) where read_at is null;

-- Run even when nobody signs in or receives a push. Existing push-delivery
-- foreign keys cascade when inbox records are deleted; source content stays.
select cron.schedule('darasax-notification-retention','10 * * * *','select private.prune_notifications();');
select private.prune_notifications();

-- Keep two delivery events, but one displayed alert per dated lesson.
create or replace function public.enqueue_lesson_push() returns void language plpgsql security definer set search_path='' as $$
declare today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date;
begin
 if auth.role()<>'service_role' then raise insufficient_privilege; end if;
 -- Retire the old 10-minute jobs. Already delivered records remain intact.
 update private.push_deliveries set state='failed',last_error='reminder_schedule_updated' where lesson_id is not null and lesson_phase is null and state in ('pending','processing');
 insert into private.push_deliveries(subscription_id,lesson_id,lesson_start,lesson_original_date,lesson_phase,event_key,payload,expires_at)
 select s.id,o.series_id,x.start_at,o.original_date,phase.name,
 'lesson:'||o.series_id||':'||o.original_date||':'||x.start_at||':'||phase.name,
 jsonb_build_object('title',case phase.name when 'advance' then 'DarasaX · Class in 30 minutes' else 'DarasaX · Class starts now' end,
 'body',public.timetable_module_label(o.module_id)||' · '||o.start_time||'–'||o.end_time||' EAT · '||coalesce(nullif(o.room,''),'Room to be confirmed'),
 'href','/timetable','tag','lesson:'||o.series_id||':'||o.original_date,'lessonPhase',phase.name,'timestamp',extract(epoch from x.start_at)*1000),
 case phase.name when 'advance' then x.start_at else x.start_at+interval '2 minutes' end
 from public.get_timetable_occurrences(today,today+1) o
 cross join lateral(select ((o.session_date+o.start_time::time) at time zone 'Africa/Dar_es_Salaam') start_at) x
 cross join (values('advance'),('start')) phase(name)
 join private.push_subscriptions s on s.lessons
 join public.profiles p on p.id=s.user_id left join public.staff_profiles staff on staff.id=s.user_id and staff.status='active'
 where o.status in ('scheduled','rescheduled') and private.push_eligible(s.user_id)
 and ((phase.name='advance' and x.start_at>now()+interval '28 minutes' and x.start_at<=now()+interval '30 minutes')
 or (phase.name='start' and x.start_at<=now() and x.start_at>now()-interval '2 minutes'))
 and ((staff.id is null and p.class_name=o.stream_id) or (staff.role='class_rep' and staff.stream_id=o.stream_id)
 or (staff.role='lecturer' and o.stream_id=any(staff.stream_ids) and o.module_id=any(staff.module_ids)))
 on conflict(subscription_id,event_key) do update set payload=excluded.payload,state='pending',available_at=now(),attempts=0
 where private.push_deliveries.state='failed' and private.push_deliveries.last_error='session_changed';
 delete from private.push_deliveries where expires_at<now()-interval '7 days';
end; $$;

update private.push_deliveries set payload=jsonb_set(jsonb_set(payload,'{tag}',to_jsonb('lesson:'||lesson_id||':'||lesson_original_date)),'{lessonPhase}',to_jsonb(lesson_phase)) where lesson_id is not null and lesson_original_date is not null and lesson_phase in ('advance','start') and state in ('pending','processing');
