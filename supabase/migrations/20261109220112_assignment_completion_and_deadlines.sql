alter table public.materials add column completed_at timestamptz;

create or replace function public.can_submit_assignment(assignment_id text) returns boolean
language sql stable security invoker set search_path=''
as $$
 select auth.uid() is not null
   and public.active_student_stream() is not null
   and exists(select 1 from public.materials m where m.id=assignment_id
     and m.kind='assignment' and m.status='published' and m.online_submission
     and m.completed_at is null
     and (m.stream_id is null or m.stream_id=public.active_student_stream())
     and (m.due_at is null or m.due_at>now()));
$$;

create function private.set_assignment_done(assignment_id text,mark_done boolean)
returns timestamptz language plpgsql security definer set search_path='' as $$
declare target public.materials; staff public.staff_profiles; completion timestamptz;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 if mark_done is null then raise exception 'Choose whether the assignment is done'; end if;
 select * into target from public.materials where id=assignment_id for update;
 if not found or target.kind<>'assignment' or target.status<>'published' then
  raise exception 'Published assignment not found';
 end if;
 select * into staff from public.staff_profiles where id=auth.uid() and status='active';
 if not found or staff.role not in ('admin','class_rep','lecturer') then raise insufficient_privilege; end if;
 if not public.can_manage_material(target.uploaded_by_id,target.stream_id,target.module_id) then
  if staff.role='class_rep' and target.stream_id is null then
   null; -- Any active CR may close an all-stream assignment.
  elsif staff.role='lecturer' and target.stream_id is null
    and target.module_id=any(staff.module_ids) and cardinality(staff.stream_ids)>0
    and not exists(select 1 from public.academic_classes c where not c.archived
      and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE'
      and c.year=3 and c.semester=1 and not c.id=any(staff.stream_ids)) then
   null; -- Match the lecturer's all-stream publishing permission.
  else
   raise insufficient_privilege using message='You may only manage assignments in your assigned class and module';
  end if;
 end if;
 update public.materials set completed_at=case when mark_done then coalesce(completed_at,clock_timestamp()) else null end
  where id=assignment_id returning completed_at into completion;
 insert into public.audit_log(actor,role,action,summary,detail,stream_id,actor_id)
 values(coalesce(staff.full_name,'Staff'),staff.role::text,'upload',
   case when mark_done then 'Marked assignment done' else 'Reopened assignment' end,
   target.title,target.stream_id,auth.uid());
 return completion;
end; $$;
revoke all on function private.set_assignment_done(text,boolean) from public,anon;
grant execute on function private.set_assignment_done(text,boolean) to authenticated;

create function public.set_assignment_done(assignment_id text,mark_done boolean)
returns timestamptz language sql security invoker set search_path='' as $$
 select private.set_assignment_done(assignment_id,mark_done);
$$;
revoke all on function public.set_assignment_done(text,boolean) from public,anon;
grant execute on function public.set_assignment_done(text,boolean) to authenticated;

notify pgrst, 'reload schema';
