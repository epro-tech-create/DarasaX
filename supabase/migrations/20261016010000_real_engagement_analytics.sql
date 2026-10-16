begin;
create table public.student_daily_activity (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null default ((now() at time zone 'Africa/Dar_es_Salaam')::date),
 stream_id text not null,
 primary key(user_id,day)
);
create index student_activity_day_idx on public.student_daily_activity(day,stream_id);
create table public.material_daily_views (
 user_id uuid not null references auth.users(id) on delete cascade,
 material_id text not null references public.materials(id) on delete cascade,
 day date not null,
 stream_id text not null,
 opens integer not null default 1 check(opens>0),
 last_opened_at timestamptz not null default now(),
 primary key(user_id,material_id,day)
);
create index material_views_day_idx on public.material_daily_views(day,stream_id);
alter table public.student_daily_activity enable row level security;
alter table public.material_daily_views enable row level security;
revoke all on public.student_daily_activity, public.material_daily_views from anon,authenticated;

create function public.record_student_activity() returns void
language plpgsql security definer set search_path=public
as $$ declare student_stream text:=public.active_student_stream(); begin
 if student_stream is null or exists(select 1 from public.staff_profiles where id=auth.uid() and status='active') then return; end if;
 insert into public.student_daily_activity(user_id,day,stream_id)
 values(auth.uid(),(now() at time zone 'Africa/Dar_es_Salaam')::date,student_stream)
 on conflict(user_id,day) do nothing;
end; $$;

create function public.record_material_view(mid text) returns void
language plpgsql security definer set search_path=public
as $$ declare student_stream text:=public.active_student_stream(); begin
 if student_stream is null or exists(select 1 from public.staff_profiles where id=auth.uid() and status='active') then return; end if;
 if not exists(select 1 from public.materials where id=mid and status='published' and (stream_id is null or stream_id=student_stream)) then return; end if;
 perform public.record_student_activity();
 insert into public.material_daily_views(user_id,material_id,day,stream_id)
 values(auth.uid(),mid,(now() at time zone 'Africa/Dar_es_Salaam')::date,student_stream)
 on conflict(user_id,material_id,day) do update set opens=material_daily_views.opens+1,last_opened_at=now()
 where material_daily_views.last_opened_at < now()-interval '30 seconds';
end; $$;

create function public.engagement_summary() returns jsonb
language plpgsql stable security definer set search_path=public
as $$ declare scope text; is_administrator boolean:=public.is_admin(); today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date; result jsonb; begin
 if not is_administrator then
  select stream_id into scope from public.staff_profiles where id=auth.uid() and role='class_rep' and status='active';
  if scope is null then raise exception 'Not authorized' using errcode='42501'; end if;
 end if;
 select jsonb_build_object(
  'days',(select jsonb_agg(jsonb_build_object('date',d::date,'active',
   (select count(*) from public.student_daily_activity a where a.day=d::date and (is_administrator or a.stream_id=scope)),
   'opens',(select coalesce(sum(v.opens),0) from public.material_daily_views v where v.day=d::date and (is_administrator or v.stream_id=scope))) order by d)
   from generate_series(today-13,today,interval '1 day') d),
  'activeStudents',(select count(distinct a.user_id) from public.student_daily_activity a where a.day between today-6 and today and (is_administrator or a.stream_id=scope)),
  'uniqueViewers',(select count(distinct v.user_id) from public.material_daily_views v where v.day between today-6 and today and (is_administrator or v.stream_id=scope))
 ) into result;
 return result;
end; $$;
revoke all on function public.record_student_activity(),public.record_material_view(text),public.engagement_summary() from public,anon;
grant execute on function public.record_student_activity(),public.record_material_view(text),public.engagement_summary() to authenticated;
commit;
