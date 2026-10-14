begin;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); mid1 text:='scope-test-'||gen_random_uuid()::text; mid2 text:='scope-test-'||gen_random_uuid()::text;
begin
 insert into auth.users(id,email,email_confirmed_at,created_at,updated_at,raw_user_meta_data) values
 (a,'scope-'||a::text||'@example.invalid',now(),now(),now(),'{}'),
 (b,'scope-'||b::text||'@example.invalid',now(),now(),now(),'{}'),
 (c,'scope-'||c::text||'@example.invalid',now(),now(),now(),'{}');
 update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,class_name='BENG24COE-1',onboarding_completed=true where id=a;
 update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,class_name='BENG24COE-2',onboarding_completed=true where id=b;
 if (select count(*) from public.monitored_students where profile_id in (a,b,c))<>3 then raise exception 'Registered accounts missing from roster'; end if;
 insert into storage.objects(bucket_id,name) values('materials','BENG24COE-1/'||mid1||'.pdf'),('materials','BENG24COE-2/'||mid2||'.pdf');
 insert into public.materials(id,title,kind,stream_id,file_path,uploaded_by) values
 (mid1,'Scope class 1','notes','BENG24COE-1','BENG24COE-1/'||mid1||'.pdf','Security test'),
 (mid2,'Scope class 2','assignment','BENG24COE-2','BENG24COE-2/'||mid2||'.pdf','Security test');
 perform set_config('test.student',a::text,true); perform set_config('test.other',b::text,true); perform set_config('test.pending',c::text,true);
 perform set_config('test.material1',mid1,true); perform set_config('test.material2',mid2,true);
 perform set_config('request.jwt.claim.sub',a::text,true); perform set_config('request.jwt.claim.role','authenticated',true);
end $$;
set local role authenticated;
do $$ declare blocked boolean;
begin
 if (select count(*) from public.materials where id in (current_setting('test.material1'),current_setting('test.material2')))<>1 then raise exception 'Cross-class material leak'; end if;
 if exists(select 1 from public.materials where id=current_setting('test.material2')) then raise exception 'Wrong class assignment visible'; end if;
 if exists(select 1 from storage.objects where name='BENG24COE-2/'||current_setting('test.material2')||'.pdf') then raise exception 'Cross-class file leak'; end if;
 if not exists(select 1 from storage.objects where name='BENG24COE-1/'||current_setting('test.material1')||'.pdf') then raise exception 'Own file inaccessible'; end if;
 if exists(select 1 from public.timetable_entries where stream_id<>'BENG24COE-1') then raise exception 'Other timetable visible'; end if;
 blocked:=false;
 begin update public.profiles set class_name='BENG24COE-2' where id=auth.uid(); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Student changed own class'; end if;
 blocked:=false;
 begin update public.profiles set semester=2 where id=auth.uid(); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Student changed own semester'; end if;
 blocked:=false;
 begin update public.profiles set programme='OTHER' where id=auth.uid(); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Student changed own course'; end if;
 blocked:=false;
 begin perform public.increment_material_downloads(current_setting('test.material2')); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Wrong-class material action allowed'; end if;
 perform public.increment_material_downloads(current_setting('test.material1'));
 update public.profiles set full_name='Personal name remains editable' where id=auth.uid();
end $$;
reset role;
do $$ begin
 if not exists(select 1 from public.monitored_students where profile_id=current_setting('test.student')::uuid and name='Personal name remains editable') then raise exception 'Profile update did not sync roster'; end if;
 perform set_config('request.jwt.claim.sub',current_setting('test.pending'),true);
end $$;
set local role authenticated;
do $$ declare blocked boolean:=false;
begin
 begin update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=2,class_name='BENG24COE-1',onboarding_completed=true where id=auth.uid(); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Semester 2 activated'; end if;
 blocked:=false;
 begin update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='OTHER',year_of_study=3,semester=1,class_name='BENG24COE-1',onboarding_completed=true where id=auth.uid(); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Another course activated'; end if;
 blocked:=false;
 begin update public.profiles set institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=2,semester=1,class_name='BENG24COE-1',onboarding_completed=true where id=auth.uid(); exception when others then blocked:=true; end;
 if not blocked then raise exception 'Another year activated'; end if;
 if exists(select 1 from public.materials) then raise exception 'Incomplete student accessed class material'; end if;
end $$;
reset role;
-- Administrators may approve a class transfer; student self-transfer remains blocked.
select set_config('request.jwt.claim.sub',(select id::text from public.staff_profiles where role='admin' and status='active' limit 1),true);
set local role authenticated;
update public.monitored_students set stream_id='BENG24COE-2' where profile_id=current_setting('test.student')::uuid;
reset role;
do $$ begin
 if (select class_name from public.profiles where id=current_setting('test.student')::uuid)<>'BENG24COE-2' then raise exception 'Admin class transfer did not update actual account'; end if;
end $$;
rollback;
