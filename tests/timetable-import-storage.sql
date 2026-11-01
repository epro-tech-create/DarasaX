begin;
select set_config('test.cr',(select id::text from public.staff_profiles where role='class_rep' and status='active' and stream_id='BENG24COE-1' limit 1),true);
select set_config('test.other',(select id::text from public.staff_profiles where role='class_rep' and status='active' and stream_id<>'BENG24COE-1' limit 1),true);
select set_config('test.path','BENG24COE-1/'||current_setting('test.cr')||'/'||gen_random_uuid()||'.jpg',true);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.cr'),'role','authenticated')::text,true);
insert into storage.objects(bucket_id,name,metadata) values('timetable-import-uploads',current_setting('test.path'),'{"size":6000000,"mimetype":"image/jpeg"}');
do $$ begin
 if not exists(select 1 from storage.objects where bucket_id='timetable-import-uploads' and name=current_setting('test.path')) then raise exception 'CR cannot read own timetable upload'; end if;
 begin
  insert into storage.objects(bucket_id,name) values('timetable-import-uploads','BENG24COE-2/'||auth.uid()||'/'||gen_random_uuid()||'.jpg');
  raise exception 'FAILED: upload to another class';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
do $$ begin if exists(select 1 from storage.objects where bucket_id='timetable-import-uploads' and name=current_setting('test.path')) then raise exception 'Another CR can read this private upload'; end if; end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.cr'),'role','authenticated')::text,true);
set local role anon;
do $$ begin if exists(select 1 from storage.objects where bucket_id='timetable-import-uploads') then raise exception 'Anonymous import files exposed'; end if; end $$;
reset role;
rollback;
