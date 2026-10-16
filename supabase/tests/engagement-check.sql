begin;
do $$ declare student_id uuid; admin_id uuid; cr_id uuid; report jsonb; material text; n integer; before_opens integer; expected integer;
begin
 if has_table_privilege('authenticated','public.student_daily_activity','SELECT') or has_table_privilege('authenticated','public.material_daily_views','INSERT') then raise exception 'Raw activity table access allowed'; end if;
 if has_function_privilege('anon','public.engagement_summary()','EXECUTE') then raise exception 'Anonymous analytics access allowed'; end if;
 select p.id into student_id from public.profiles p where p.onboarding_completed and p.class_name in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4') and not exists(select 1 from public.staff_profiles s where s.id=p.id and s.status='active') limit 1;
 if student_id is null then raise exception 'No student fixture available'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',student_id,'role','authenticated')::text,true);
 perform public.record_student_activity(); perform public.record_student_activity();
 select count(*) into n from public.student_daily_activity where user_id=student_id and day=(now() at time zone 'Africa/Dar_es_Salaam')::date;
 if n<>1 then raise exception 'Daily deduplication failed'; end if;
 begin perform public.engagement_summary(); raise exception 'Student analytics access allowed'; exception when insufficient_privilege then null; end;
 select m.id into material from public.materials m where m.status='published' and (m.stream_id is null or m.stream_id=public.active_student_stream()) limit 1;
 if material is not null then
  perform public.record_material_view(material);
  select opens into before_opens from public.material_daily_views where user_id=student_id and material_id=material and day=(now() at time zone 'Africa/Dar_es_Salaam')::date;
  perform public.record_material_view(material);
  select opens into n from public.material_daily_views where user_id=student_id and material_id=material and day=(now() at time zone 'Africa/Dar_es_Salaam')::date;
  if n<>before_opens then raise exception 'View deduplication failed'; end if;
 end if;
 select id into admin_id from public.staff_profiles where role='admin' and status='active' limit 1;
 if admin_id is null then raise exception 'No admin fixture available'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 report:=public.engagement_summary();
 if jsonb_array_length(report->'days')<>14 then raise exception 'Invalid comparison window'; end if;
 perform public.record_student_activity();
 if exists(select 1 from public.student_daily_activity where user_id=admin_id) then raise exception 'Staff counted as student'; end if;
 select id into cr_id from public.staff_profiles where role='class_rep' and status='active' limit 1;
 if cr_id is not null then
  perform set_config('request.jwt.claims',jsonb_build_object('sub',cr_id,'role','authenticated')::text,true);
  report:=public.engagement_summary();
  if jsonb_array_length(report->'days')<>14 then raise exception 'Invalid CR analytics'; end if;
  select count(distinct a.user_id) into expected from public.student_daily_activity a where a.stream_id=(select stream_id from public.staff_profiles where id=cr_id) and a.day between (now() at time zone 'Africa/Dar_es_Salaam')::date-6 and (now() at time zone 'Africa/Dar_es_Salaam')::date;
  if (report->>'activeStudents')::integer<>expected then raise exception 'CR class isolation failed'; end if;
 end if;
end; $$;
select 'Daily uniqueness, repeat-open suppression, student denial, staff exclusion, and 14-day report checks passed' as result;
rollback;
