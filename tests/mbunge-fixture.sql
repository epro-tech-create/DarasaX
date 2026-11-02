-- Isolated local PostgreSQL fixture only. Never run on a hosted database.
\ir security-schema.sql
create schema private;
grant usage on schema private to authenticated;
\ir ../supabase/migrations/20261021110905_administrator_email_device_verification.sql
\ir global-materials-fixture.sql
create policy self_profile on public.profiles for select to authenticated using(id=auth.uid());
\ir ../supabase/migrations/20261021142203_global_material_publication.sql
create table public.timetable_entries(id text primary key,stream_id text,module_id text,created_by uuid);
alter table public.timetable_entries enable row level security;
grant select,insert on public.timetable_entries to authenticated;
create policy "Timetable writable by staff in scope" on public.timetable_entries for all to authenticated
 using(public.is_admin() or (public.is_staff() and stream_id=public.my_stream()))
 with check(public.is_admin() or (public.is_staff() and stream_id=public.my_stream()));
create policy "Timetable creation stays in assigned module scope" on public.timetable_entries as restrictive for insert to authenticated with check(public.staff_material_scope(stream_id,module_id));
create policy "Students browse class timetables" on public.timetable_entries for select to authenticated using(public.active_student_stream() is not null);
-- The production transactions are unchanged except for this permission call.
create function private.change_timetable_session(target_entry text,target_date date,target_scope text,replacement_date date,replacement_start text,replacement_end text,replacement_room text,replacement_lecturer text,replacement_module text,target_status text,reason_text text,request_key uuid)
returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.staff_material_scope('BENG24COE-2',replacement_module) then raise insufficient_privilege; end if;
end; $$;
create function private.cancel_timetable_today(target_class text,reason_text text,request_key uuid)
returns integer language plpgsql security definer set search_path='' as $$ declare member public.staff_profiles; begin
 select * into member from public.staff_profiles where id=auth.uid() and status='active';
 if member.id is null or not ((member.role='admin' and public.is_admin()) or (member.role='class_rep' and member.stream_id=target_class)) then raise insufficient_privilege; end if; return 0;
end; $$;
revoke all on function private.change_timetable_session(text,date,text,date,text,text,text,text,text,text,text,uuid),private.cancel_timetable_today(text,text,uuid) from public,anon;
grant execute on function private.change_timetable_session(text,date,text,date,text,text,text,text,text,text,text,uuid),private.cancel_timetable_today(text,text,uuid) to authenticated;
\ir ../supabase/migrations/20261102041042_mbunge_and_class_chat.sql
