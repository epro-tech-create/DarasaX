begin;
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('material','topic')),
  source_id text not null,
  title text not null,
  body text not null,
  type text not null check (type in ('assignment','notes','timetable','exam','announcement')),
  href text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, source_type, source_id)
);
create index notifications_inbox_idx on public.notifications(recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications(recipient_id) where read_at is null;
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy "Users read only their notifications" on public.notifications
for select to authenticated using (recipient_id = auth.uid());
create policy "Users mark only their notifications read" on public.notifications
for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- No historical backfill: recipients are captured only at publication time.
create or replace function public.notify_material_publication()
returns trigger language plpgsql security definer set search_path = public
as $$ declare event_at timestamptz := clock_timestamp(); notification_kind text; destination text; heading text;
begin
  if tg_op = 'DELETE' then
    delete from public.notifications where source_type='material' and source_id=old.id;
    return old;
  end if;
  if new.status <> 'published' then
    delete from public.notifications where source_type='material' and source_id=new.id;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.status = 'published' then return new; end if;
  end if;
  notification_kind := case when new.kind in ('notes','slides') then 'notes' when new.kind='past_paper' then 'exam' when new.kind='assignment' then 'assignment' else 'announcement' end;
  heading := case new.kind when 'notes' then 'New notes uploaded' when 'slides' then 'New slides uploaded' when 'past_paper' then 'New past paper' when 'assignment' then 'New assignment' when 'announcement' then 'New announcement' else 'New material' end;
  destination := case new.kind when 'past_paper' then '/past-papers' when 'announcement' then '/announcements' when 'assignment' then '/assignments' else case when new.module_id is not null then '/modules/' || new.module_id else '/modules' end end;
  insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href,created_at)
  select p.id,'material',new.id,heading,new.title,notification_kind,destination,event_at
  from public.profiles p join auth.users u on u.id=p.id
  where u.created_at <= event_at and u.email_confirmed_at is not null
    and (new.stream_id is null or p.class_name = new.stream_id
      or exists(select 1 from public.staff_profiles s where s.id=p.id and s.status='active'
        and (s.role='admin' or s.stream_id = new.stream_id or new.stream_id = any(s.stream_ids))))
    and p.id is distinct from new.uploaded_by_id
  on conflict(recipient_id,source_type,source_id) do nothing;
  return new;
end; $$;

create trigger material_publication_notifications after insert or update or delete on public.materials
for each row execute function public.notify_material_publication();

create or replace function public.notify_topic_publication()
returns trigger language plpgsql security definer set search_path = public
as $$ declare event_at timestamptz := clock_timestamp();
begin
  if tg_op = 'DELETE' then
    delete from public.notifications where source_type='topic' and source_id=old.id;
    return old;
  end if;
  if not new.published then
    delete from public.notifications where source_type='topic' and source_id=new.id;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.published then return new; end if;
  end if;
  insert into public.notifications(recipient_id,source_type,source_id,title,body,type,href,created_at)
  select p.id,'topic',new.id,'New topic published',new.title,'announcement',
    '/modules/' || new.module_id || '/topics/' || new.id,event_at
  from public.profiles p join auth.users u on u.id=p.id
  where u.created_at <= event_at and u.email_confirmed_at is not null
    and p.id is distinct from new.created_by_id
  on conflict(recipient_id,source_type,source_id) do nothing;
  return new;
end; $$;
create trigger topic_publication_notifications after insert or update or delete on public.module_topics
for each row execute function public.notify_topic_publication();
commit;
