-- All identities and files are synthetic. No email or object-storage requests.
begin;
create trigger material_class_required before insert or update on public.materials for each row execute function public.require_material_class();
create function pg_temp.check_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAILED: %',label; end if; end; $$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000901','cr-one@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000000902','cr-two@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000000903','lecturer@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000000904','student-one@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000000905','student-two@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000000906','pending@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000000907','inactive@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-000000000908','administrator@example.invalid',now(),'{}');
insert into public.staff_profiles(id,role,status,stream_id,stream_ids,module_ids) values
 ('00000000-0000-4000-8000-000000000901','class_rep','active','BENG24COE-1','{}','{}'),
 ('00000000-0000-4000-8000-000000000902','class_rep','active','BENG24COE-2','{}','{}'),
 ('00000000-0000-4000-8000-000000000903','lecturer','active',null,array['BENG24COE-1'],array['mod-web']),
 ('00000000-0000-4000-8000-000000000907','lecturer','inactive',null,array['BENG24COE-1'],array['mod-web']),
 ('00000000-0000-4000-8000-000000000908','admin','active',null,'{}','{}');
update public.profiles set class_name=case when id='00000000-0000-4000-8000-000000000905' then 'BENG24COE-2' else 'BENG24COE-1' end,
 institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',year_of_study=3,semester=1,onboarding_completed=true
 where id in ('00000000-0000-4000-8000-000000000904','00000000-0000-4000-8000-000000000905','00000000-0000-4000-8000-000000000906');
update public.student_admissions set status='approved' where user_id in ('00000000-0000-4000-8000-000000000904','00000000-0000-4000-8000-000000000905');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000901","role":"authenticated"}',true);
select pg_temp.check_true(public.can_publish_material(null,'mod-web'),'CR can publish globally');
select pg_temp.check_true(public.can_publish_material('BENG24COE-2','mod-web'),'CR may select another class for publishing');
select pg_temp.check_true(not public.can_publish_material('missing','mod-web'),'unknown class blocked');
insert into public.materials(id,title,uploaded_by_id,role,stream_id,module_id,file_path) values
 ('globaltest-cr','Global CR file',auth.uid(),'class_rep',null,'mod-web','r2:__all__/globaltest-cr/u/f.pdf'),
 ('globaltest-class','Class 2 file',auth.uid(),'class_rep','BENG24COE-2','mod-web','r2:BENG24COE-2/globaltest-class/u/f.pdf');
insert into public.materials(id,title,uploaded_by_id,role,stream_id,module_id,status,file_path) values
 ('globaltest-draft','Draft',auth.uid(),'class_rep',null,'mod-web','draft','r2:__all__/globaltest-draft/u/f.pdf');
do $$ begin
 begin insert into public.materials(id,title,uploaded_by_id,role,module_id) values('globaltest-forged','Forged','00000000-0000-4000-8000-000000000902','class_rep','mod-web'); raise exception 'FAILED: forged author'; exception when insufficient_privilege then null; end;
 begin update public.materials set uploaded_by_id='00000000-0000-4000-8000-000000000902' where id='globaltest-cr'; raise exception 'FAILED: reassigned author'; exception when raise_exception then if sqlerrm like 'FAILED:%' then raise; end if; end;
end; $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000902","role":"authenticated"}',true);
select pg_temp.check_true(exists(select 1 from public.materials where id='globaltest-cr'),'other CR can read global publication');
select pg_temp.check_true(not exists(select 1 from public.materials where id='globaltest-draft'),'other CR cannot read global draft');
with changed as (update public.materials set title='Forbidden' where id='globaltest-cr' returning id) select pg_temp.check_true(not exists(select 1 from changed),'global read does not grant editing');
with changed as (delete from public.materials where id='globaltest-cr' returning id) select pg_temp.check_true(not exists(select 1 from changed),'global read does not grant deletion');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000903","role":"authenticated"}',true);
select pg_temp.check_true(public.can_publish_material(null,'mod-web') and public.can_publish_material('BENG24COE-2','mod-web'),'lecturer publishes assigned module to any/all classes');
select pg_temp.check_true(not public.can_publish_material(null,'mod-other'),'lecturer module restriction preserved');
insert into public.materials(id,title,uploaded_by_id,role,module_id,file_path) values('globaltest-lecturer','Lecturer global',auth.uid(),'lecturer','mod-web','r2:__all__/globaltest-lecturer/u/f.pdf');
update public.materials set title='Updated own global' where id='globaltest-lecturer';
select pg_temp.check_true((select title='Updated own global' from public.materials where id='globaltest-lecturer'),'uploader can manage own global file');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000904","role":"authenticated"}',true);
select pg_temp.check_true(exists(select 1 from public.materials where id='globaltest-cr') and not exists(select 1 from public.materials where id='globaltest-class'),'class 1 student gets global, not class 2');
select pg_temp.check_true(not exists(select 1 from public.materials where id='globaltest-draft'),'draft blocked for student');
select pg_temp.check_true(not public.can_publish_material(null,'mod-web'),'student cannot upload');
select public.create_material_share('globaltest-cr') as global_token \gset
select pg_temp.check_true((public.get_shared_material(:'global_token')->>'id')='globaltest-cr','global sharing works for approved student');
select public.increment_material_downloads('globaltest-cr');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000905","role":"authenticated"}',true);
select pg_temp.check_true(exists(select 1 from public.materials where id='globaltest-cr') and exists(select 1 from public.materials where id='globaltest-class'),'class 2 sees global and selected-class file');
select pg_temp.check_true(public.get_shared_material(:'global_token') is not null,'shared global file opens in a second stream');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000906","role":"authenticated"}',true);
select pg_temp.check_true(not exists(select 1 from public.materials where id like 'globaltest-%'),'pending student cannot read global or class material');
select pg_temp.check_true(public.get_shared_material(:'global_token') is null,'shared global link does not bypass approval');
do $$ begin begin perform public.create_material_share('globaltest-cr'); raise exception 'FAILED: pending sharing'; exception when insufficient_privilege then null; end; end; $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000907","role":"authenticated"}',true);
select pg_temp.check_true(not public.can_publish_material(null,'mod-web'),'inactive lecturer denied');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000908","role":"authenticated"}',true);
select pg_temp.check_true(not public.can_publish_material(null,'mod-web'),'admin still needs email step-up');
reset role;
insert into auth.sessions(id,user_id) values('00000000-0000-4000-8000-000000000918','00000000-0000-4000-8000-000000000908');
insert into private.admin_verified_sessions(session_id,user_id,expires_at) values('00000000-0000-4000-8000-000000000918','00000000-0000-4000-8000-000000000908',now()+interval '1 hour');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000908","role":"authenticated","session_id":"00000000-0000-4000-8000-000000000918"}',true);
select pg_temp.check_true(public.can_publish_material(null,'mod-web') and public.can_manage_material('00000000-0000-4000-8000-000000000901',null,'mod-web'),'verified administrator retains global management');
reset role;
set local role anon;
select set_config('request.jwt.claims','{}',true);
select pg_temp.check_true(public.get_shared_material(:'global_token') is null,'shared global link requires sign-in');
do $$ begin
 begin
   if exists(select 1 from public.materials where id like 'globaltest-%') then raise exception 'FAILED: anonymous material read'; end if;
 exception when insufficient_privilege then null;
 end;
end; $$;
reset role;
rollback;
