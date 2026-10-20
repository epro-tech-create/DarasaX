begin;
create or replace function public.record_sign_in() returns void
language plpgsql security definer set search_path=public
as $$
declare uid uuid:=auth.uid(); person text; person_role text; class_id text;
begin
 if uid is null then raise exception 'Not authenticated' using errcode='42501'; end if;
 select full_name,role,stream_id into person,person_role,class_id from public.staff_profiles where id=uid and status='active';
 if person_role is null then
  if exists(select 1 from public.staff_profiles where id=uid) then raise exception 'Inactive staff' using errcode='42501'; end if;
  select full_name,class_name into person,class_id from public.profiles where id=uid;
  person_role:='student';
 end if;
 insert into public.audit_log(actor,role,action,summary,detail,stream_id,actor_id)
 values(coalesce(nullif(person,''),(select email from auth.users where id=uid),'User'),person_role,'login','Signed in',null,class_id,uid);
end; $$;
revoke all on function public.record_sign_in() from public,anon;
grant execute on function public.record_sign_in() to authenticated;
create or replace function public.engagement_summary(period_days integer) returns jsonb
language plpgsql stable security definer set search_path=public
as $$ declare scope text; is_administrator boolean:=public.is_admin(); today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date; result jsonb; begin
 if period_days not in (7,30) or period_days is null then raise exception 'Invalid period'; end if;
 if not is_administrator then
  select stream_id into scope from public.staff_profiles where id=auth.uid() and role='class_rep' and status='active';
  if scope is null then raise exception 'Not authorized' using errcode='42501'; end if;
 end if;
 select jsonb_build_object(
  'days',(select jsonb_agg(jsonb_build_object('date',d::date,'active',
   (select count(*) from public.student_daily_activity a where a.day=d::date and (is_administrator or a.stream_id=scope)),
   'opens',(select coalesce(sum(v.opens),0) from public.material_daily_views v where v.day=d::date and (is_administrator or v.stream_id=scope))) order by d)
   from generate_series(today-(period_days*2-1),today,interval '1 day') d),
  'activeStudents',(select count(distinct a.user_id) from public.student_daily_activity a where a.day between today-(period_days-1) and today and (is_administrator or a.stream_id=scope)),
  'uniqueViewers',(select count(distinct v.user_id) from public.material_daily_views v where v.day between today-(period_days-1) and today and (is_administrator or v.stream_id=scope))
 ) into result;
 return result;
end; $$;

revoke all on function public.engagement_summary(integer) from public,anon;
grant execute on function public.engagement_summary(integer) to authenticated;
commit;
