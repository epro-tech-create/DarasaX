begin;
-- Extend existing chat permissions without changing or removing stored records.
-- Verified admins use the shared room; CRs use their assigned class and shared room.
-- Lecturers do not receive chat access through a student profile.
create or replace function public.can_chat_in_room(target_room text) returns boolean
language sql stable security invoker set search_path=''
as $$ select auth.uid() is not null and (
 (public.is_admin() and target_room='__all__')
 or exists(select 1 from public.staff_profiles s join public.academic_classes c on c.id=s.stream_id and not c.archived
   where s.id=auth.uid() and s.status='active' and s.role='class_rep' and target_room in ('__all__',s.stream_id))
 or (not exists(select 1 from public.staff_profiles s where s.id=auth.uid())
   and public.active_student_stream() is not null and target_room in ('__all__',public.active_student_stream()))
 ); $$;
commit;
