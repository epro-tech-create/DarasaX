-- A deleted lesson is distinct from a cancelled lesson: deleted occurrences
-- leave the active timetable, while the exception/revision and change log
-- retain an audit trail.
alter table public.timetable_exceptions
  drop constraint timetable_exceptions_status_check,
  add constraint timetable_exceptions_status_check
    check (status in ('rescheduled','postponed','cancelled','deleted'));

alter table public.timetable_revisions
  drop constraint timetable_revisions_status_check,
  add constraint timetable_revisions_status_check
    check (status in ('scheduled','postponed','cancelled','deleted'));

create or replace function public.get_timetable_occurrences(range_start date,range_end date)
returns table(series_id text,original_date date,session_date date,stream_id text,module_id text,day int,start_time text,end_time text,room text,lecturer text,status text,reason text)
language plpgsql stable security invoker set search_path='' as $$
begin
 if range_start is null or range_end is null or range_end<range_start or range_end-range_start>92 then raise exception 'Choose a date range of at most 93 days'; end if;
 return query
 with dates as (
  select t.id entry_id,d::date origin from public.timetable_entries t cross join pg_catalog.generate_series(range_start::timestamp,range_end::timestamp,interval '1 day') d
  union
  select e.entry_id,e.original_date from public.timetable_exceptions e where e.superseded_at is null and e.session_date between range_start and range_end
 ), resolved as (
  select t.id series_id,d.origin original_date,coalesce(e.session_date,d.origin) session_date,t.stream_id,
   coalesce(e.module_id,r.module_id,t.module_id) module_id,coalesce(e.start_time,r.start_time,t.start_time) start_time,
   coalesce(e.end_time,r.end_time,t.end_time) end_time,coalesce(e.room,r.room,t.room) room,coalesce(e.lecturer,r.lecturer,t.lecturer) lecturer,
   coalesce(e.status,r.status,'scheduled') status,coalesce(e.reason,r.reason,'') reason
  from dates d join public.timetable_entries t on t.id=d.entry_id
  left join lateral(select v.* from public.timetable_revisions v where v.entry_id=t.id and v.effective_from<=d.origin and v.superseded_at is null order by v.effective_from desc,v.created_at desc limit 1) r on true
  left join public.timetable_exceptions e on e.entry_id=t.id and e.original_date=d.origin and e.superseded_at is null
  where e.id is not null or ((t.valid_from is null or d.origin>=t.valid_from) and (t.valid_until is null or d.origin<=t.valid_until)
    and extract(dow from d.origin)=coalesce(r.day,t.day) and (r.id is null or d.origin>=r.first_date))
 ) select x.series_id,x.original_date,x.session_date,x.stream_id,x.module_id,extract(dow from x.session_date)::int,x.start_time,x.end_time,x.room,x.lecturer,x.status,x.reason
 from resolved x where x.session_date between range_start and range_end and x.status<>'deleted' order by x.session_date,x.start_time,x.series_id;
end; $$;

create or replace function private.delete_timetable_session(target_entry text,target_date date,target_scope text,reason_text text,request_key uuid)
returns void language plpgsql security definer set search_path='' as $$
declare base public.timetable_entries; occurrence record; existing_change public.timetable_changes;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 select * into base from public.timetable_entries where id=target_entry for update;
 if base.id is null or not public.can_manage_timetable(base.stream_id,base.module_id) then raise insufficient_privilege using message='You may only delete sessions for your assigned class and modules'; end if;
 if exists(select 1 from public.timetable_changes c where c.id=request_key and c.changed_by=auth.uid() and c.entry_id=target_entry and c.status='deleted') then return; end if;
 select * into occurrence from public.get_timetable_occurrences(target_date,target_date) o where o.series_id=target_entry and o.original_date=target_date;
 if not found then
  -- A moved occurrence may have an original date outside its current date range.
  select e.* into occurrence from public.timetable_exceptions e
   where e.entry_id=target_entry and e.original_date=target_date and e.superseded_at is null;
 end if;
 if occurrence.start_time is null then raise exception 'The selected session is not on the timetable'; end if;

 -- Reuse the established transaction for authorization, reminder cleanup, and history.
 perform private.change_timetable_session(target_entry,target_date,target_scope,target_date,occurrence.start_time,occurrence.end_time,
   occurrence.room,occurrence.lecturer,occurrence.module_id,'cancelled',reason_text,request_key);

 if target_scope='future' then
  update public.timetable_exceptions set status='deleted',session_date=original_date
   where entry_id=target_entry and original_date>=target_date and superseded_at is null;
  update public.timetable_revisions set status='deleted'
   where entry_id=target_entry and effective_from=target_date and superseded_at is null;
 else
  update public.timetable_exceptions set status='deleted',session_date=original_date
   where entry_id=target_entry and original_date=target_date and superseded_at is null;
 end if;
 update public.timetable_changes set status='deleted' where id=request_key and entry_id=target_entry;
 update public.audit_log set summary='Lesson deleted'
  where id=(select a.id from public.audit_log a where a.actor_id=auth.uid() and a.stream_id=base.stream_id
    and a.action='timetable_edit' and a.summary='Session cancelled' and a.at=transaction_timestamp()
    order by a.id desc limit 1);
end; $$;
revoke all on function private.delete_timetable_session(text,date,text,text,uuid) from public,anon;
grant execute on function private.delete_timetable_session(text,date,text,text,uuid) to authenticated;

create or replace function public.delete_timetable_session(target_entry text,target_date date,target_scope text,reason_text text,request_key uuid)
returns void language sql security invoker set search_path='' as $$
 select private.delete_timetable_session(target_entry,target_date,target_scope,reason_text,request_key);
$$;
revoke all on function public.delete_timetable_session(text,date,text,text,uuid) from public,anon;
grant execute on function public.delete_timetable_session(text,date,text,text,uuid) to authenticated;
