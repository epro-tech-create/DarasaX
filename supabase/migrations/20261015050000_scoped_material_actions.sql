begin;
create or replace function public.increment_material_downloads(mid text)
returns void language plpgsql security definer set search_path=public
as $$ begin
 if not exists(select 1 from public.materials m where m.id=mid and
  (public.staff_material_scope(m.stream_id,m.module_id) or (m.status='published' and m.stream_id=public.active_student_stream() and m.programme='BENG24COE' and m.year_of_study=3 and m.semester=1))) then
  raise exception 'This file is not available to your class';
 end if;
 update public.materials set downloads=downloads+1 where id=mid;
end; $$;
revoke all on function public.increment_material_downloads(text) from public, anon;
grant execute on function public.increment_material_downloads(text) to authenticated;
create or replace function public.staff_topic_scope(target_module text)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.staff_profiles where id=auth.uid() and status='active'
 and (role in ('admin','class_rep') or (role='lecturer' and target_module=any(module_ids)))); $$;
drop policy "Topics writable by staff" on public.module_topics;
create policy "Topics created in teaching scope" on public.module_topics for insert to authenticated with check(public.staff_topic_scope(module_id));
create policy "Topics edited in teaching scope" on public.module_topics for update to authenticated using(public.staff_topic_scope(module_id)) with check(public.staff_topic_scope(module_id));
create policy "Topics removed in teaching scope" on public.module_topics for delete to authenticated using(public.staff_topic_scope(module_id));
commit;
