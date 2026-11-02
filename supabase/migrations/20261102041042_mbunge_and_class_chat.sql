begin;

-- Mbunge is an administrator-appointed student capability. No staff login or
-- student profile fields are changed, and no new access to approvals is granted.
create table public.mbunge_appointments (
 student_id uuid primary key references public.profiles(id) on delete cascade,
 appointed_by uuid not null references auth.users(id),
 appointed_at timestamptz not null default now(),
 revoked_at timestamptz,
 revoked_by uuid references auth.users(id)
);
create unique index one_active_mbunge on public.mbunge_appointments ((true)) where revoked_at is null;
alter table public.mbunge_appointments enable row level security;
revoke all on public.mbunge_appointments from public,anon,authenticated;
grant select on public.mbunge_appointments to authenticated;
grant all on public.mbunge_appointments to service_role;
create policy "Read own appointment or administer" on public.mbunge_appointments
 for select to authenticated using(student_id=(select auth.uid()) or public.is_admin());

create function public.is_mbunge() returns boolean language sql stable security invoker set search_path=''
as $$ select auth.uid() is not null and public.active_student_stream() is not null
 and exists(select 1 from public.mbunge_appointments a where a.student_id=auth.uid() and a.revoked_at is null); $$;
revoke all on function public.is_mbunge() from public,anon;
grant execute on function public.is_mbunge() to authenticated;

create function public.mbunge_class_scope(target_stream text) returns boolean language sql stable security invoker set search_path=''
as $$ select public.is_mbunge() and (target_stream is null or exists(
 select 1 from public.academic_classes c where c.id=target_stream and not c.archived
 and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1)); $$;
revoke all on function public.mbunge_class_scope(text) from public,anon;
grant execute on function public.mbunge_class_scope(text) to authenticated;

create function private.appoint_mbunge(student_email text) returns void language plpgsql security definer set search_path=''
as $$ declare target uuid; begin
 if auth.uid() is null or not public.is_admin() then raise insufficient_privilege using message='Verified administrator access required'; end if;
 perform pg_advisory_xact_lock(hashtext('darasax:mbunge-appointment'));
 select p.id into target from public.profiles p join auth.users u on u.id=p.id
 join public.student_admissions a on a.user_id=p.id and a.status='approved'
 join public.academic_classes c on c.id=p.class_name and not c.archived
 where lower(u.email)=lower(trim(student_email)) and u.email_confirmed_at is not null
 and p.onboarding_completed and p.institution='Dar es Salaam Institute of Technology (DIT)'
 and p.programme='BENG24COE' and p.year_of_study=3 and p.semester=1
 and c.institution=p.institution and c.programme=p.programme and c.year=p.year_of_study and c.semester=p.semester
 and not exists(select 1 from public.staff_profiles s where s.id=p.id);
 if target is null then raise exception 'Choose an existing verified, approved student in an active class'; end if;
 if exists(select 1 from public.mbunge_appointments where revoked_at is null and student_id<>target) then
   raise exception 'Remove the current Mbunge before appointing another student'; end if;
 insert into public.mbunge_appointments(student_id,appointed_by) values(target,auth.uid())
 on conflict(student_id) do update set appointed_by=excluded.appointed_by,appointed_at=now(),revoked_at=null,revoked_by=null;
 insert into public.audit_log(actor,role,action,summary,detail,actor_id)
 values('Administrator','admin','other','Appointed Mbunge',target::text,auth.uid());
end; $$;
create function private.revoke_mbunge(target_student uuid) returns void language plpgsql security definer set search_path=''
as $$ begin
 if auth.uid() is null or not public.is_admin() then raise insufficient_privilege using message='Verified administrator access required'; end if;
 perform pg_advisory_xact_lock(hashtext('darasax:mbunge-appointment'));
 update public.mbunge_appointments set revoked_at=now(),revoked_by=auth.uid() where student_id=target_student and revoked_at is null;
 if not found then raise exception 'This Mbunge appointment is no longer active'; end if;
 insert into public.audit_log(actor,role,action,summary,detail,actor_id)
 values('Administrator','admin','other','Removed Mbunge appointment',target_student::text,auth.uid());
end; $$;
create function private.list_mbunge_appointments() returns jsonb language plpgsql stable security definer set search_path=''
as $$ begin
 if auth.uid() is null or not public.is_admin() then raise insufficient_privilege using message='Verified administrator access required'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('student_id',a.student_id,'name',p.full_name,'email',p.email,
  'class_name',p.class_name,'appointed_at',a.appointed_at,'revoked_at',a.revoked_at) order by a.appointed_at desc)
  from public.mbunge_appointments a join public.profiles p on p.id=a.student_id),'[]'::jsonb);
end; $$;
revoke all on function private.appoint_mbunge(text),private.revoke_mbunge(uuid),private.list_mbunge_appointments() from public,anon;
grant execute on function private.appoint_mbunge(text),private.revoke_mbunge(uuid),private.list_mbunge_appointments() to authenticated;
create function public.appoint_mbunge(student_email text) returns void language sql security invoker set search_path=''
as $$ select private.appoint_mbunge(student_email); $$;
create function public.revoke_mbunge(target_student uuid) returns void language sql security invoker set search_path=''
as $$ select private.revoke_mbunge(target_student); $$;
create function public.list_mbunge_appointments() returns jsonb language sql stable security invoker set search_path=''
as $$ select private.list_mbunge_appointments(); $$;
revoke all on function public.appoint_mbunge(text),public.revoke_mbunge(uuid),public.list_mbunge_appointments() from public,anon;
grant execute on function public.appoint_mbunge(text),public.revoke_mbunge(uuid),public.list_mbunge_appointments() to authenticated;

-- Preserve staff_material_scope: assignment hand-ins and other staff-only
-- features also use it. Mbunge gets separate material and timetable helpers.
create function public.can_manage_timetable(target_stream text,target_module text default null) returns boolean
language sql stable security invoker set search_path=''
as $$ select public.mbunge_class_scope(target_stream) or public.staff_material_scope(target_stream,target_module); $$;
revoke all on function public.can_manage_timetable(text,text) from public,anon;
grant execute on function public.can_manage_timetable(text,text) to authenticated;
create or replace function public.can_manage_material(owner_id uuid,target_stream text,target_module text default null)
returns boolean language sql stable security invoker set search_path=''
as $$ select public.mbunge_class_scope(target_stream) or public.staff_material_scope(target_stream,target_module)
 or (owner_id=auth.uid() and public.can_publish_material(target_stream,target_module)); $$;

alter policy "Timetable creation stays in assigned module scope" on public.timetable_entries
 with check(public.can_manage_timetable(stream_id,module_id));
-- Change only the permission predicate in the two existing dated-scheduling
-- transactions; retain their cancellation, revision, reminder and history logic.
do $$ declare signature text; definition text; begin
 foreach signature in array array[
  'private.change_timetable_session(text,date,text,date,text,text,text,text,text,text,text,uuid)'
 ] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  if position('public.staff_material_scope(' in definition)=0 then raise exception 'Unexpected scheduling function definition: %',signature; end if;
  execute replace(definition,'public.staff_material_scope(','public.can_manage_timetable(');
 end loop;
end; $$;
-- The day-off transaction uses a staff record for its author and class checks.
-- Supply that local record only after the student capability is verified; this
-- never creates or updates a staff membership.
do $$ declare definition text; needle text:=$code$select * into member from public.staff_profiles where id=auth.uid() and status='active';$code$; begin
 definition:=pg_get_functiondef('private.cancel_timetable_today(text,text,uuid)'::regprocedure);
 if position(needle in definition)=0 then raise exception 'Unexpected day-off function definition'; end if;
 execute replace(definition,needle,needle||$code$
 if public.mbunge_class_scope(target_class) then
  member.id:=auth.uid(); member.role:='class_rep'; member.stream_id:=target_class;
  select coalesce(nullif(trim(p.full_name),''),'Student') into member.full_name from public.profiles p where p.id=auth.uid();
 end if;
 $code$);
end; $$;

create or replace function public.can_publish_material(target_stream text,target_module text default null)
returns boolean language sql stable security invoker set search_path=''
as $$ select (public.is_mbunge() or exists(select 1 from public.staff_profiles s where s.id=auth.uid() and s.status='active'
 and ((s.role='admin' and public.is_admin()) or s.role='class_rep'
 or (s.role='lecturer' and (target_module is null or target_module=any(s.module_ids))))))
 and (target_stream is null or exists(select 1 from public.academic_classes c where c.id=target_stream and not c.archived
 and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1)); $$;

-- Existing content uses the class_rep publisher enum. This policy permits that
-- publisher value only after checking the separate, real Mbunge appointment.
create policy "Appointed Mbunge publishes class content" on public.materials for insert to authenticated
 with check(uploaded_by_id=(select auth.uid()) and role::text='class_rep' and public.mbunge_class_scope(stream_id));
create policy "Appointed Mbunge creates class timetable" on public.timetable_entries for insert to authenticated
 with check(created_by=(select auth.uid()) and public.mbunge_class_scope(stream_id));
create or replace function public.can_import_timetable(target_class text) returns boolean
language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and (public.mbunge_class_scope(target_class)
 or (public.my_staff_role() in ('admin','class_rep') and public.staff_material_scope(target_class,null))); $$;

create function private.mbunge_students() returns jsonb language plpgsql stable security definer set search_path=''
as $$ begin
 if auth.uid() is null or not public.is_mbunge() then raise insufficient_privilege using message='Active Mbunge appointment required'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'email',p.email,
  'registration_number',a.registration_number,'class_name',p.class_name) order by p.full_name,p.id)
 from public.profiles p join public.student_admissions a on a.user_id=p.id and a.status='approved'
 join public.academic_classes c on c.id=p.class_name
 where public.mbunge_class_scope(c.id) and p.onboarding_completed and p.institution=c.institution
 and p.programme=c.programme and p.year_of_study=c.year and p.semester=c.semester),'[]'::jsonb);
end; $$;
revoke all on function private.mbunge_students() from public,anon;
grant execute on function private.mbunge_students() to authenticated;
create function public.mbunge_students() returns jsonb language sql stable security invoker set search_path=''
as $$ select private.mbunge_students(); $$;
revoke all on function public.mbunge_students() from public,anon;
grant execute on function public.mbunge_students() to authenticated;

-- Chat starts empty. A room is either the student's current class or '__all__'.
create table public.class_messages (
 id uuid primary key default gen_random_uuid(), room_id text not null,
 author_id uuid not null references public.profiles(id) on delete cascade,
 author_name text not null, body text not null check(length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default clock_timestamp()
);
create index class_messages_room_time on public.class_messages(room_id,created_at desc,id desc);
create index class_messages_author_time on public.class_messages(author_id,created_at desc);
create table public.class_message_reads (
 user_id uuid not null references public.profiles(id) on delete cascade,
 room_id text not null, read_at timestamptz not null default clock_timestamp(), primary key(user_id,room_id)
);
alter table public.class_messages enable row level security;
alter table public.class_message_reads enable row level security;
revoke all on public.class_messages,public.class_message_reads from public,anon,authenticated;
grant select,insert,delete on public.class_messages to authenticated;
grant select,insert,update on public.class_message_reads to authenticated;
grant all on public.class_messages,public.class_message_reads to service_role;
create function public.can_chat_in_room(target_room text) returns boolean language sql stable security invoker set search_path=''
as $$ select public.active_student_stream() is not null and (target_room='__all__' or target_room=public.active_student_stream()); $$;
revoke all on function public.can_chat_in_room(text) from public,anon;
grant execute on function public.can_chat_in_room(text) to authenticated;
create policy "Students read their chat rooms" on public.class_messages for select to authenticated using(public.can_chat_in_room(room_id));
create policy "Students send as themselves" on public.class_messages for insert to authenticated
 with check(author_id=(select auth.uid()) and public.can_chat_in_room(room_id));
create policy "Students remove own messages" on public.class_messages for delete to authenticated
 using(author_id=(select auth.uid()) and public.can_chat_in_room(room_id));
create policy "Read own chat receipts" on public.class_message_reads for select to authenticated using(user_id=(select auth.uid()) and public.can_chat_in_room(room_id));
create policy "Insert own chat receipts" on public.class_message_reads for insert to authenticated with check(user_id=(select auth.uid()) and public.can_chat_in_room(room_id));
create policy "Update own chat receipts" on public.class_message_reads for update to authenticated
 using(user_id=(select auth.uid()) and public.can_chat_in_room(room_id)) with check(user_id=(select auth.uid()) and public.can_chat_in_room(room_id));

create function private.stamp_class_message() returns trigger language plpgsql security definer set search_path=''
as $$ begin
 if auth.uid() is null or new.author_id<>auth.uid() or not public.can_chat_in_room(new.room_id) then raise insufficient_privilege; end if;
 -- Serialize each sender's inserts to prevent concurrent rate-limit bypass.
 perform pg_advisory_xact_lock(hashtext('darasax:chat:'||auth.uid()::text));
 if (select count(*) from public.class_messages where author_id=auth.uid() and created_at>clock_timestamp()-interval '1 minute')>=30 then
  raise exception 'Too many messages. Please wait a moment'; end if;
 select coalesce(nullif(trim(p.full_name),''),'Student') into new.author_name from public.profiles p where p.id=auth.uid();
 new.created_at:=clock_timestamp(); new.body:=trim(new.body);
 return new;
end; $$;
revoke all on function private.stamp_class_message() from public,anon,authenticated;
create trigger stamp_class_message before insert on public.class_messages for each row execute function private.stamp_class_message();
create function private.stamp_chat_read() returns trigger language plpgsql security invoker set search_path=''
as $$ begin
 new.read_at:=least(new.read_at,clock_timestamp());
 if tg_op='UPDATE' then new.read_at:=greatest(new.read_at,old.read_at); end if;
 return new;
end; $$;
revoke all on function private.stamp_chat_read() from public,anon,authenticated;
create trigger stamp_chat_read before insert or update on public.class_message_reads for each row execute function private.stamp_chat_read();
create function public.chat_unread_counts() returns jsonb language sql stable security invoker set search_path=''
as $$ select coalesce(jsonb_object_agg(room_id,unread),'{}'::jsonb) from (
 select m.room_id,count(*) as unread from public.class_messages m
 left join public.class_message_reads r on r.room_id=m.room_id and r.user_id=auth.uid()
 where m.author_id<>auth.uid() and m.created_at>coalesce(r.read_at,'-infinity'::timestamptz)
 group by m.room_id) counts; $$;
revoke all on function public.chat_unread_counts() from public,anon;
grant execute on function public.chat_unread_counts() to authenticated;
commit;
