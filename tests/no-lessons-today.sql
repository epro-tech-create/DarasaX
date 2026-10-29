-- Rollback-only fixture; no real announcements or phone alerts are published.
begin;
do $$
declare actor uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid();
 class_id text:='TEST-'||upper(replace(gen_random_uuid()::text,'-',''));
 series text:='no-lessons-fixture-'||gen_random_uuid();
 today date:=(now() at time zone 'Africa/Dar_es_Salaam')::date;
 notice text; result integer;
begin
 insert into auth.users(id,email,email_confirmed_at,created_at,raw_user_meta_data) values
 (actor,actor||'@example.invalid',now(),now(),'{}'),(outsider,outsider||'@example.invalid',now(),now(),'{}');
 insert into public.academic_classes(id,label,institution,programme,year,semester)
 values(class_id,'Fixture class','Dar es Salaam Institute of Technology (DIT)','BENG24COE',3,1);
 insert into public.staff_profiles(id,role,status,stream_id,full_name) values(actor,'class_rep','active',class_id,'Fixture CR');
 insert into public.timetable_entries(id,stream_id,module_id,day,start_time,end_time,room,lecturer)
 values(series,class_id,'mod-numerical',extract(dow from today),'08:00','10:00','Fixture room','Fixture lecturer');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 result:=public.cancel_timetable_today(class_id,'',gen_random_uuid());
 if result<>1 then raise exception 'No-reason day cancellation failed'; end if;
 notice:='no-lessons-'||class_id||'-'||today;
 if not exists(select 1 from public.materials where id=notice and body like '%No sessions will take place today.%' and body not like '%Reason:%') then raise exception 'Simple no-lessons announcement missing'; end if;
 if exists(select 1 from public.timetable_exceptions where entry_id=series and reason<>'') then raise exception 'Cancellation stored a reason'; end if;
 if not exists(select 1 from public.get_timetable_occurrences(today,today) where series_id=series and status='cancelled') then raise exception 'Today was not cancelled'; end if;
 if not exists(select 1 from public.get_timetable_occurrences(today+7,today+7) where series_id=series and status='scheduled') then raise exception 'Next week was changed'; end if;
 if public.cancel_timetable_today(class_id,'',gen_random_uuid())<>0 then raise exception 'Repeated confirmation was not idempotent'; end if;
 if (select count(*) from public.materials where id=notice)<>1 then raise exception 'Duplicate no-lessons announcement'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',outsider,'role','authenticated')::text,true);
 begin
  perform public.cancel_timetable_today(class_id,'',gen_random_uuid());
  raise exception 'Unauthorized cancellation accepted';
 exception when insufficient_privilege then null;
 end;
end; $$;
rollback;
