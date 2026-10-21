begin;
do $$
declare student_id uuid; cr_id uuid; admin_id uuid; roster text; before_status text; candidate text:=repeat('9',63)||'1'; other_number text:=repeat('9',63)||'2'; result jsonb; blocked boolean;
begin
 select a.user_id into student_id from public.student_admissions a join auth.users u on u.id=a.user_id where u.email_confirmed_at is not null and a.status='approved' and exists(select 1 from public.monitored_students m join public.profiles p on p.id=a.user_id where m.profile_id=a.user_id or lower(m.email)=lower(p.email)) and not exists(select 1 from public.staff_profiles s where s.id=a.user_id) limit 1;
 select s.id into cr_id from public.staff_profiles s join auth.users u on u.id=s.id join public.student_admissions a on a.user_id=s.id where s.role='class_rep' and s.status='active' and u.email_confirmed_at is not null and a.status not in ('rejected','suspended') limit 1;
 if student_id is null or cr_id is null then raise exception 'Missing student/CR fixtures'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',student_id,'role','authenticated')::text,true);
 select status into before_status from public.student_admissions where user_id=student_id;
 perform public.update_my_registration_number(candidate);
 if not exists(select 1 from public.student_admissions where user_id=student_id and registration_number=candidate and status=before_status) then raise exception 'Self edit changed approval'; end if;
 blocked:=false; begin perform public.update_my_registration_number('24abc'); exception when others then blocked:=true; end; if not blocked then raise exception 'Letters accepted'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',cr_id,'role','authenticated')::text,true);
 blocked:=false; begin perform public.update_my_registration_number(candidate); exception when unique_violation then blocked:=true; end; if not blocked then raise exception 'Duplicate accepted'; end if;
 perform public.update_my_registration_number(other_number);
 if not exists(select 1 from public.student_admissions where user_id=cr_id and registration_number=other_number) then raise exception 'CR self edit failed'; end if;
 blocked:=false; begin perform public.admin_edit_student_registration('missing',candidate,'{}'); exception when insufficient_privilege then blocked:=true; end; if not blocked then raise exception 'CR admin access accepted'; end if;
 select s.id into admin_id from public.staff_profiles s where s.role='admin' and s.status='active' limit 1;
 select id into roster from public.monitored_students where profile_id=student_id or lower(email)=(select lower(email) from public.profiles where id=student_id) limit 1;
 if roster is null or admin_id is null then raise exception 'Missing admin/roster fixtures'; end if;
 -- Transaction-local test setup only; rolled back with every student change.
 update private.admin_security_policy set enabled=true;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 blocked:=false; begin perform public.admin_edit_student_registration(roster,candidate,'{}'); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Admin without email verification accepted'; end if;
 update private.admin_security_policy set enabled=false;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 result:=public.admin_edit_student_registration(roster,repeat('9',63)||'3','{}');
 if result->>'registration_number'<>repeat('9',63)||'3' then raise exception 'Admin edit failed'; end if;
 blocked:=false; begin perform public.admin_edit_student_registration(roster,other_number,'{"name":"Invalid partial save"}'); exception when unique_violation then blocked:=true; end;
 if not blocked or exists(select 1 from public.monitored_students where id=roster and name='Invalid partial save') then raise exception 'Duplicate admin edit was not atomic'; end if;
 if (select status from public.student_admissions where user_id=student_id)<>before_status then raise exception 'Admin changed approval'; end if;
 perform set_config('request.jwt.claims','{}',true);
 blocked:=false; begin perform public.update_my_registration_number(candidate); exception when insufficient_privilege then blocked:=true; end; if not blocked then raise exception 'Guest accepted'; end if;
end; $$;
rollback;
