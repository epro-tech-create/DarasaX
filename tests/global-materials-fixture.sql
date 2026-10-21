-- Extend the isolated security fixture only. Never run against production.
alter table public.materials
 add column uploaded_by_id uuid references auth.users,
 add column stream_id text,
 add column module_id text,
 add column role text,
 add column status text default 'published',
 add column kind text default 'notes',
 add column programme text default 'BENG24COE',
 add column year_of_study integer default 3,
 add column semester integer default 1,
 add column file_path text,
 add column file_name text,
 add column mime_type text,
 add column size_label text,
 add column created_at timestamptz default now(),
 add column downloads integer default 0;
create table public.material_shares(material_id text unique references public.materials(id),token uuid default gen_random_uuid(),created_by uuid);
create policy classes_read on public.academic_classes for select to authenticated using(not archived or public.is_staff());
drop policy material_read on public.materials;
create policy "Class materials inserted by scoped staff" on public.materials for insert to authenticated with check(public.staff_material_scope(stream_id,module_id));
create policy "Class materials readable by authorized users" on public.materials for select to authenticated using(public.staff_material_scope(stream_id,module_id));
create policy "Class materials updated by scoped staff" on public.materials for update to authenticated using(public.staff_material_scope(stream_id,module_id));
create policy "Class materials deleted by scoped staff" on public.materials for delete to authenticated using(public.staff_material_scope(stream_id,module_id));
