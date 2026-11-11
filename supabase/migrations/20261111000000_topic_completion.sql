create table public.student_topic_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_id text not null references public.module_topics(id) on delete cascade,
  completed boolean not null,
  primary key (user_id, topic_id)
);

create table public.class_topic_completion (
  class_id text not null references public.academic_classes(id) on delete cascade,
  topic_id text not null references public.module_topics(id) on delete cascade,
  primary key (class_id, topic_id)
);

alter table public.student_topic_progress enable row level security;
alter table public.class_topic_completion enable row level security;
revoke all on public.student_topic_progress, public.class_topic_completion from public, anon, authenticated;
grant select, insert, update on public.student_topic_progress to authenticated;
grant select on public.class_topic_completion to authenticated;

create policy "Students read their own progress" on public.student_topic_progress
for select to authenticated using (user_id = (select auth.uid()));

create policy "Students create their own progress" on public.student_topic_progress
for insert to authenticated with check (
  user_id = (select auth.uid()) and (select public.active_student_stream()) is not null
  and exists (select 1 from public.module_topics where id = topic_id and published)
);

create policy "Students update their own progress" on public.student_topic_progress
for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and (select public.active_student_stream()) is not null
  and exists (select 1 from public.module_topics where id = topic_id and published)
);

create policy "Students and CRs read class completion" on public.class_topic_completion
for select to authenticated using (
  exists (select 1 from public.module_topics where id = topic_id and published)
  and (class_id = (select public.active_student_stream()) or exists (
    select 1 from public.staff_profiles
    where id = (select auth.uid()) and status = 'active' and role = 'class_rep'
  ))
);

create function private.set_class_topic_completion(target_topic text, all_classes boolean, mark_done boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare own_class text;
begin
  select stream_id into own_class from public.staff_profiles
  where id = auth.uid() and status = 'active' and role = 'class_rep';
  if not found or all_classes is null or mark_done is null then
    raise exception 'Class representative access required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.module_topics where id = target_topic and published) then
    raise exception 'Topic is not published';
  end if;

  if mark_done then
    insert into public.class_topic_completion (class_id, topic_id)
    select id, target_topic from public.academic_classes
    where not archived and (all_classes or id = own_class)
    on conflict do nothing;
  else
    delete from public.class_topic_completion c
    using public.academic_classes a
    where c.topic_id = target_topic and c.class_id = a.id
      and not a.archived and (all_classes or a.id = own_class);
  end if;
end;
$$;

create function public.set_class_topic_completion(target_topic text, all_classes boolean, mark_done boolean)
returns void language sql security invoker set search_path = '' as $$
  select private.set_class_topic_completion(target_topic, all_classes, mark_done);
$$;

revoke all on function private.set_class_topic_completion(text, boolean, boolean),
  public.set_class_topic_completion(text, boolean, boolean) from public, anon;
grant execute on function private.set_class_topic_completion(text, boolean, boolean),
  public.set_class_topic_completion(text, boolean, boolean) to authenticated;
