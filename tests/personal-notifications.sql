begin;
-- Transaction-only fixtures; no emails are sent and all changes are rolled back.
do $$
declare first_topic text := 'notification-test-' || gen_random_uuid()::text;
  second_topic text := 'notification-test-' || gen_random_uuid()::text;
  newcomer uuid := gen_random_uuid(); outsider uuid := gen_random_uuid(); existing uuid; material_id text := 'notification-material-' || gen_random_uuid()::text;
begin
  if exists(select 1 from public.notifications) then
    raise notice 'Existing personal inboxes are preserved';
  end if;
  insert into public.module_topics(id,module_id,number,title,published)
  values(first_topic,'mod-sensor-networks',1900000001,'Notification test before signup',true);
  select recipient_id into existing from public.notifications where source_id=first_topic limit 1;
  if existing is null then raise exception 'Expected an existing verified recipient'; end if;
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at,raw_user_meta_data)
  values(newcomer,'notification-test-' || newcomer::text || '@example.invalid',now(),now(),now(),'{}'::jsonb);
  update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,class_name='BENG24COE-1',onboarding_completed=true where id=newcomer;
  if exists(select 1 from public.notifications where recipient_id=newcomer) then raise exception 'New account inherited historical notifications'; end if;
  insert into public.module_topics(id,module_id,number,title,published)
  values(second_topic,'mod-sensor-networks',1900000002,'Notification test after signup',false);
  if exists(select 1 from public.notifications where source_id=second_topic) then raise exception 'Draft topic sent notification'; end if;
  update public.module_topics set published=true where id=second_topic;
  if (select count(*) from public.notifications where recipient_id=newcomer)<>1 then raise exception 'New account did not receive exactly one future event'; end if;
  update public.module_topics set title='Edited title' where id=second_topic;
  if (select count(*) from public.notifications where recipient_id=newcomer)<>1 then raise exception 'Edit duplicated notification'; end if;
  update public.profiles set class_name='BENG24COE-1' where id=newcomer;
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at,raw_user_meta_data)
  values(outsider,'notification-test-' || outsider::text || '@example.invalid',now(),now(),now(),'{}'::jsonb);
  update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,class_name='BENG24COE-2',onboarding_completed=true where id=outsider;
  insert into public.materials(id,title,kind,status,stream_id,uploaded_by)
  values(material_id,'Class-specific notification test','notes','pending','BENG24COE-1','Security test');
  if exists(select 1 from public.notifications where source_id=material_id) then raise exception 'Draft material sent a notification'; end if;
  update public.materials set status='published' where id=material_id;
  if not exists(select 1 from public.notifications where source_id=material_id and recipient_id=newcomer) then raise exception 'Class recipient did not receive material notification'; end if;
  if exists(select 1 from public.notifications where source_id=material_id and recipient_id=outsider) then raise exception 'Wrong class received notification'; end if;
  update public.materials set downloads=downloads+1 where id=material_id;
  if (select count(*) from public.notifications where source_id=material_id and recipient_id=newcomer)<>1 then raise exception 'Material edit duplicated notification'; end if;
  update public.materials set status='pending' where id=material_id;
  if exists(select 1 from public.notifications where source_id=material_id) then raise exception 'Withdrawn material left notifications'; end if;
  perform set_config('test.newcomer',newcomer::text,true);
  perform set_config('test.existing',existing::text,true);
  perform set_config('test.topic',second_topic,true);
  perform set_config('request.jwt.claim.sub',newcomer::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
end $$;
set local role authenticated;
do $$ declare changed integer; blocked boolean := false;
begin
  if exists(select 1 from public.notifications where recipient_id<>auth.uid()) then raise exception 'Cross-user notification read allowed'; end if;
  update public.notifications set read_at=now() where source_id=current_setting('test.topic');
  get diagnostics changed = row_count;
  if changed<>1 then raise exception 'Own notification could not be marked read'; end if;
  update public.notifications set read_at=now() where recipient_id=current_setting('test.existing')::uuid;
  get diagnostics changed = row_count;
  if changed<>0 then raise exception 'Cross-user mark-read allowed'; end if;
  begin
    update public.notifications set recipient_id=current_setting('test.existing')::uuid where recipient_id=auth.uid();
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Notification recipient could be reassigned'; end if;
end $$;
reset role;
do $$ begin
  if exists(select 1 from public.notifications where recipient_id=current_setting('test.existing')::uuid and source_id=current_setting('test.topic') and read_at is not null) then
    raise exception 'One student reading a notification marked another inbox read';
  end if;
end $$;
rollback;

