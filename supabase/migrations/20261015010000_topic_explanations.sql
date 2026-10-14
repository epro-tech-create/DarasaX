begin;
alter table public.module_topics
  add column if not exists content text,
  add column if not exists learning_objectives text[] not null default '{}'::text[];
comment on column public.module_topics.content is 'Staff-authored topic explanation, rendered as plain text.';
comment on column public.module_topics.learning_objectives is 'Staff-authored learning objectives for the student topic page.';
commit;
