begin;
select set_config('test.user_a',(select p.id::text from public.profiles p join public.student_admissions a on a.user_id=p.id and a.status='approved' where p.class_name='BENG24COE-1' and p.onboarding_completed and not exists(select 1 from public.staff_profiles s where s.id=p.id) order by p.created_at limit 1),true);
select set_config('test.user_b',(select p.id::text from public.profiles p join public.student_admissions a on a.user_id=p.id and a.status='approved' where p.class_name='BENG24COE-1' and p.onboarding_completed and not exists(select 1 from public.staff_profiles s where s.id=p.id) order by p.created_at offset 1 limit 1),true);
select set_config('test.post','reaction-test-'||gen_random_uuid()::text,true);
insert into public.materials(id,title,kind,stream_id,status,body) values
(current_setting('test.post'),'Reaction verification','announcement','BENG24COE-1','published','Rolled back test'),
(current_setting('test.post')||'-other','Other class','announcement','BENG24COE-3','published','Rolled back test'),
(current_setting('test.post')||'-draft','Draft','announcement','BENG24COE-1','pending','Rolled back test'),
(current_setting('test.post')||'-notes','Notes','notes','BENG24COE-1','published','Rolled back test');
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
set local role authenticated;
select public.set_announcement_reaction(current_setting('test.post'),'👍');
select public.set_announcement_reaction(current_setting('test.post'),'👍');
do $$ begin
if (select reaction_count from public.get_announcement_reactions(array[current_setting('test.post')]))<>1 then raise exception 'Duplicate reaction counted'; end if;
end $$;
select public.set_announcement_reaction(current_setting('test.post'),'❤️');
do $$ begin
if not exists(select 1 from public.get_announcement_reactions(array[current_setting('test.post')]) where emoji='❤️' and reaction_count=1 and reacted_by_me) then raise exception 'Switch/own reaction failed'; end if;
begin
perform public.set_announcement_reaction(current_setting('test.post')||'-other','👍');
raise exception 'Cross-class access allowed';
exception when insufficient_privilege then null; end;
begin
perform public.set_announcement_reaction(current_setting('test.post')||'-draft','👍');
raise exception 'Draft access allowed';
exception when insufficient_privilege then null; end;
begin
perform public.set_announcement_reaction(current_setting('test.post')||'-notes','👍');
raise exception 'Non-announcement access allowed';
exception when insufficient_privilege then null; end;
begin
insert into public.announcement_reactions values(current_setting('test.post'),current_setting('test.user_b')::uuid,'👍');
raise exception 'Forged user reaction allowed';
exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_b'),true);
select public.set_announcement_reaction(current_setting('test.post'),'👍');
do $$ begin
if (select sum(reaction_count) from public.get_announcement_reactions(array[current_setting('test.post')]))<>2 then raise exception 'Shared counts failed'; end if;
delete from public.announcement_reactions where user_id=current_setting('test.user_a')::uuid;
if not exists(select 1 from public.get_announcement_reactions(array[current_setting('test.post')]) where emoji='❤️' and not reacted_by_me) then raise exception 'Another user reaction was removed'; end if;
end $$;
select public.set_announcement_reaction(current_setting('test.post'),null);
do $$ begin
if (select sum(reaction_count) from public.get_announcement_reactions(array[current_setting('test.post')]))<>1 then raise exception 'Remove reaction failed'; end if;
end $$;
reset role;
delete from public.materials where id=current_setting('test.post');
do $$ begin
if exists(select 1 from public.announcement_reactions where material_id=current_setting('test.post')) then raise exception 'Delete cascade failed'; end if;
end $$;
select 'PASS: add, idempotency, switch, remove, shared counts, own selection, cross-class/draft/non-announcement denial, ownership, cascade' verification;
rollback;
