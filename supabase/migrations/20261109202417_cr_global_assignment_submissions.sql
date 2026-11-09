-- Let active students from any stream submit to published all-stream assignments.
create or replace function public.can_submit_assignment(assignment_id text) returns boolean
language sql stable security invoker set search_path=''
as $$
 select auth.uid() is not null
   and public.active_student_stream() is not null
   and exists(select 1 from public.materials m where m.id=assignment_id
     and m.kind='assignment' and m.status='published' and m.online_submission
     and (m.stream_id is null or m.stream_id=public.active_student_stream())
     and (m.due_at is null or m.due_at>now()));
$$;

-- The uploader may review submissions to their own all-stream assignment;
-- staff scope still controls every other assignment.
drop policy "Submission private readers" on public.assignment_submissions;
create policy "Submission private readers" on public.assignment_submissions for select to authenticated using(
 student_id=(select auth.uid()) or exists(
   select 1 from public.materials m where m.id=assignment_id
     and public.can_manage_material(m.uploaded_by_id,m.stream_id,m.module_id)));

