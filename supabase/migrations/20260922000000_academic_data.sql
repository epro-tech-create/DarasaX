-- DarasaX academic data + staff auth backend
-- Run in Supabase SQL Editor (after 20260917000000_profiles.sql) or via CLI migration.
--
-- Creates:
--   public.staff_profiles      admin + class-rep accounts (Supabase Auth users)
--   public.timetable_entries   per-stream class timetable
--   public.materials           upload metadata (files live in the `materials` storage bucket)
--   public.monitored_students  staff-facing student monitoring rows
--   public.issues              staff issues desk
--   public.audit_log           staff activity log (insert-only)
--   storage bucket `materials` (private; access via signed URLs)
-- Seeds timetable / students / issues / materials metadata from the app mock data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- staff_profiles
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.staff_role as enum ('admin', 'class_rep');
exception when duplicate_object then null;
end $$;

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.staff_role not null,
  full_name text,
  email text,
  stream_id text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_profiles_role_idx on public.staff_profiles (role);
create index if not exists staff_profiles_stream_idx on public.staff_profiles (stream_id);

drop trigger if exists staff_profiles_set_updated_at on public.staff_profiles;
create trigger staff_profiles_set_updated_at
before update on public.staff_profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so RLS policies can call them without
-- recursing into staff_profiles policies). Defined after the table because
-- Postgres validates SQL function bodies at creation time.
-- ---------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles
    where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.my_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.staff_profiles where id = auth.uid();
$$;

create or replace function public.my_stream()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select stream_id from public.staff_profiles where id = auth.uid();
$$;

-- Auto-create a staff profile when a user signs up with staff role metadata.
create or replace function public.handle_new_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role text := new.raw_user_meta_data->>'role';
begin
  if staff_role in ('admin', 'class_rep') then
    insert into public.staff_profiles (id, email, full_name, role, stream_id)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
      staff_role::public.staff_role,
      nullif(new.raw_user_meta_data->>'stream_id', '')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_staff on auth.users;
create trigger on_auth_user_created_staff
after insert on auth.users
for each row execute function public.handle_new_staff();

alter table public.staff_profiles enable row level security;

drop policy if exists "Staff profiles readable by owner or admin" on public.staff_profiles;
create policy "Staff profiles readable by owner or admin"
on public.staff_profiles for select to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists "Staff profiles self-registration" on public.staff_profiles;
create policy "Staff profiles self-registration"
on public.staff_profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "Staff profiles updatable by owner (no privilege change)" on public.staff_profiles;
create policy "Staff profiles updatable by owner (no privilege change)"
on public.staff_profiles for update to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role::text = public.my_staff_role()
  and (stream_id = public.my_stream() or (stream_id is null and public.my_stream() is null))
  and status = 'active'
);

drop policy if exists "Staff profiles managed by admin" on public.staff_profiles;
create policy "Staff profiles managed by admin"
on public.staff_profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Staff profiles deletable by admin" on public.staff_profiles;
create policy "Staff profiles deletable by admin"
on public.staff_profiles for delete to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- timetable_entries
-- ---------------------------------------------------------------------------

create table if not exists public.timetable_entries (
  id text primary key,
  stream_id text not null,
  module_id text not null,
  day integer not null check (day between 0 and 6),
  start_time text not null,
  end_time text not null,
  room text not null default '',
  lecturer text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists timetable_entries_stream_idx on public.timetable_entries (stream_id);

drop trigger if exists timetable_entries_set_updated_at on public.timetable_entries;
create trigger timetable_entries_set_updated_at
before update on public.timetable_entries
for each row execute function public.set_updated_at();

alter table public.timetable_entries enable row level security;

drop policy if exists "Timetable readable by signed-in users" on public.timetable_entries;
create policy "Timetable readable by signed-in users"
on public.timetable_entries for select to authenticated
using (true);

drop policy if exists "Timetable writable by staff in scope" on public.timetable_entries;
create policy "Timetable writable by staff in scope"
on public.timetable_entries for all to authenticated
using (public.is_admin() or (public.is_staff() and stream_id = public.my_stream()))
with check (public.is_admin() or (public.is_staff() and stream_id = public.my_stream()));

-- ---------------------------------------------------------------------------
-- materials
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.upload_kind as enum ('notes', 'slides', 'past_paper', 'assignment', 'announcement', 'timetable');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.upload_status as enum ('pending', 'processing', 'published', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.materials (
  id text primary key,
  title text not null,
  kind public.upload_kind not null,
  module_id text,
  stream_id text,
  status public.upload_status not null default 'published',
  uploaded_by text not null default '',
  uploaded_by_id uuid references auth.users (id) on delete set null,
  role text,
  file_path text,
  file_url text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  size_label text,
  downloads integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists materials_stream_idx on public.materials (stream_id);
create index if not exists materials_status_idx on public.materials (status);

drop trigger if exists materials_set_updated_at on public.materials;
create trigger materials_set_updated_at
before update on public.materials
for each row execute function public.set_updated_at();

alter table public.materials enable row level security;

drop policy if exists "Materials readable when published or by staff" on public.materials;
create policy "Materials readable when published or by staff"
on public.materials for select to authenticated
using (status = 'published' or public.is_staff());

drop policy if exists "Materials writable by staff in scope" on public.materials;
create policy "Materials writable by staff in scope"
on public.materials for all to authenticated
using (
  public.is_admin()
  or (public.is_staff() and (stream_id = public.my_stream() or stream_id is null))
)
with check (
  public.is_admin()
  or (public.is_staff() and (stream_id = public.my_stream() or stream_id is null))
);

create or replace function public.increment_material_downloads(mid text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.materials
  set downloads = downloads + 1, updated_at = now()
  where id = mid;
end;
$$;

grant execute on function public.increment_material_downloads(text) to authenticated;

-- ---------------------------------------------------------------------------
-- monitored_students
-- ---------------------------------------------------------------------------

create table if not exists public.monitored_students (
  id text primary key,
  name text not null,
  email text not null,
  stream_id text not null,
  year integer not null default 3,
  attendance_pct numeric not null default 100,
  assignments_done integer not null default 0,
  assignments_total integer not null default 5,
  last_active timestamptz not null default now(),
  risk text not null default 'low' check (risk in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists monitored_students_stream_idx on public.monitored_students (stream_id);
create index if not exists monitored_students_email_idx on public.monitored_students (email);

drop trigger if exists monitored_students_set_updated_at on public.monitored_students;
create trigger monitored_students_set_updated_at
before update on public.monitored_students
for each row execute function public.set_updated_at();

alter table public.monitored_students enable row level security;

drop policy if exists "Monitored students visible to staff in scope" on public.monitored_students;
create policy "Monitored students visible to staff in scope"
on public.monitored_students for select to authenticated
using (public.is_admin() or (public.is_staff() and stream_id = public.my_stream()));

drop policy if exists "Monitored students managed by staff in scope" on public.monitored_students;
create policy "Monitored students managed by staff in scope"
on public.monitored_students for all to authenticated
using (public.is_admin() or (public.is_staff() and stream_id = public.my_stream()))
with check (public.is_admin() or (public.is_staff() and stream_id = public.my_stream()));

-- ---------------------------------------------------------------------------
-- issues
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.issue_status as enum ('open', 'in_progress', 'resolved');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.issue_severity as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.issue_category as enum ('materials', 'timetable', 'assignment', 'attendance', 'technical', 'other');
exception when duplicate_object then null;
end $$;

create table if not exists public.issues (
  id text primary key,
  title text not null,
  description text not null default '',
  category public.issue_category not null default 'other',
  severity public.issue_severity not null default 'medium',
  status public.issue_status not null default 'open',
  stream_id text,
  module_id text,
  reported_by text not null default '',
  reported_by_id uuid references auth.users (id) on delete set null,
  assignee text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issues_stream_idx on public.issues (stream_id);
create index if not exists issues_status_idx on public.issues (status);

drop trigger if exists issues_set_updated_at on public.issues;
create trigger issues_set_updated_at
before update on public.issues
for each row execute function public.set_updated_at();

alter table public.issues enable row level security;

drop policy if exists "Issues readable by staff in scope" on public.issues;
create policy "Issues readable by staff in scope"
on public.issues for select to authenticated
using (
  public.is_admin()
  or (public.is_staff() and (stream_id = public.my_stream() or stream_id is null))
);

drop policy if exists "Issues created by staff in scope" on public.issues;
create policy "Issues created by staff in scope"
on public.issues for insert to authenticated
with check (
  public.is_admin()
  or (public.is_staff() and (stream_id = public.my_stream() or stream_id is null))
);

drop policy if exists "Issues updated by staff in scope" on public.issues;
create policy "Issues updated by staff in scope"
on public.issues for update to authenticated
using (
  public.is_admin()
  or (public.is_staff() and (stream_id = public.my_stream() or stream_id is null))
)
with check (
  public.is_admin()
  or (public.is_staff() and (stream_id = public.my_stream() or stream_id is null))
);

drop policy if exists "Issues deleted by admin" on public.issues;
create policy "Issues deleted by admin"
on public.issues for delete to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log (insert-only for staff; admin reads everything)
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null default '',
  role text not null default '',
  action text not null default '',
  summary text not null default '',
  detail text,
  stream_id text,
  actor_id uuid references auth.users (id) on delete set null
);

create index if not exists audit_log_stream_idx on public.audit_log (stream_id);
create index if not exists audit_log_at_idx on public.audit_log (at desc);

alter table public.audit_log enable row level security;

drop policy if exists "Audit log readable by staff in scope" on public.audit_log;
create policy "Audit log readable by staff in scope"
on public.audit_log for select to authenticated
using (
  public.is_admin()
  or (public.is_staff() and (stream_id = public.my_stream() or stream_id is null))
);

drop policy if exists "Audit log writable by staff" on public.audit_log;
create policy "Audit log writable by staff"
on public.audit_log for insert to authenticated
with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Storage bucket `materials` (private; app mints signed URLs)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

drop policy if exists "Materials bucket readable by signed-in users" on storage.objects;
create policy "Materials bucket readable by signed-in users"
on storage.objects for select to authenticated
using (bucket_id = 'materials');

drop policy if exists "Materials bucket writable by staff" on storage.objects;
create policy "Materials bucket writable by staff"
on storage.objects for insert to authenticated
with check (bucket_id = 'materials' and public.is_staff());

drop policy if exists "Materials bucket updatable by staff" on storage.objects;
create policy "Materials bucket updatable by staff"
on storage.objects for update to authenticated
using (bucket_id = 'materials' and public.is_staff())
with check (bucket_id = 'materials' and public.is_staff());

drop policy if exists "Materials bucket deletable by staff" on storage.objects;
create policy "Materials bucket deletable by staff"
on storage.objects for delete to authenticated
using (bucket_id = 'materials' and public.is_staff());

-- ---------------------------------------------------------------------------
-- Seed data (starter content from the app mock data; safe to re-run)
-- ---------------------------------------------------------------------------

insert into public.timetable_entries (id, stream_id, module_id, day, start_time, end_time, room, lecturer) values
('tt-1-1','BENG24COE-1','mod-se',1,'08:00','10:00','LT 1','Mr. David Okello'),
('tt-1-2','BENG24COE-1','mod-sensor-networks',1,'11:00','13:00','Lab 03','Dr. John Smith'),
('tt-1-3','BENG24COE-1','mod-electronics',2,'13:00','15:00','Lab 05','Eng. Sarah Nkomo'),
('tt-1-4','BENG24COE-1','mod-dsp',3,'09:00','11:00','LT 3','Dr. Grace Kimaro'),
('tt-1-5','BENG24COE-1','mod-sensor-networks',4,'10:00','12:00','Lab 03','Dr. John Smith'),
('tt-1-6','BENG24COE-1','mod-db-admin',4,'14:00','16:00','LT 2','Prof. Amina Hassan'),
('tt-1-7','BENG24COE-1','mod-dsa',5,'10:00','11:30','Hall B','Dr. Peter Mwangi'),
('tt-1-8','BENG24COE-1','mod-hci',5,'14:00','16:00','Lab 02','Dr. Fatima Juma'),
('tt-2-1','BENG24COE-2','mod-se',1,'17:00','19:00','LT 1','Mr. David Okello'),
('tt-2-2','BENG24COE-2','mod-sensor-networks',1,'19:00','21:00','Lab 03','Dr. John Smith'),
('tt-2-3','BENG24COE-2','mod-electronics',2,'17:30','19:30','Lab 05','Eng. Sarah Nkomo'),
('tt-2-4','BENG24COE-2','mod-dsp',3,'18:00','20:00','LT 3','Dr. Grace Kimaro'),
('tt-2-5','BENG24COE-2','mod-db-admin',4,'17:00','19:00','LT 2','Prof. Amina Hassan'),
('tt-2-6','BENG24COE-2','mod-sensor-networks',4,'19:00','21:00','Lab 03','Dr. John Smith'),
('tt-2-7','BENG24COE-2','mod-dsa',5,'17:00','18:30','Hall B','Dr. Peter Mwangi'),
('tt-2-8','BENG24COE-2','mod-hci',5,'18:30','20:30','Lab 02','Dr. Fatima Juma'),
('tt-3-1','BENG24COE-3','mod-dsa',1,'07:00','09:00','Hall B','Dr. Peter Mwangi'),
('tt-3-2','BENG24COE-3','mod-se',1,'10:00','12:00','LT 4','Mr. David Okello'),
('tt-3-3','BENG24COE-3','mod-web',2,'09:00','11:00','Lab 01','Ms. Linda Mushi'),
('tt-3-4','BENG24COE-3','mod-electronics',2,'14:00','16:00','Lab 05','Eng. Sarah Nkomo'),
('tt-3-5','BENG24COE-3','mod-dsp',3,'11:00','13:00','LT 3','Dr. Grace Kimaro'),
('tt-3-6','BENG24COE-3','mod-db-admin',4,'08:00','10:00','LT 2','Prof. Amina Hassan'),
('tt-3-7','BENG24COE-3','mod-sensor-networks',4,'13:00','15:00','Lab 03','Dr. John Smith'),
('tt-3-8','BENG24COE-3','mod-hci',5,'09:00','11:00','Lab 02','Dr. Fatima Juma'),
('tt-4-1','BENG24COE-4','mod-electronics',1,'07:30','09:30','Lab 05','Eng. Sarah Nkomo'),
('tt-4-2','BENG24COE-4','mod-sensor-networks',1,'14:00','16:00','Lab 03','Dr. John Smith'),
('tt-4-3','BENG24COE-4','mod-se',2,'08:00','10:00','LT 1','Mr. David Okello'),
('tt-4-4','BENG24COE-4','mod-dsp',3,'07:00','09:00','Lab 04','Dr. Grace Kimaro'),
('tt-4-5','BENG24COE-4','mod-numerical',3,'15:00','17:00','LT 5','Dr. James Mwita'),
('tt-4-6','BENG24COE-4','mod-db-admin',4,'10:00','12:00','Lab 01','Prof. Amina Hassan'),
('tt-4-7','BENG24COE-4','mod-dsa',5,'08:00','10:00','Hall B','Dr. Peter Mwangi'),
('tt-4-8','BENG24COE-4','mod-hci',5,'13:00','15:00','Lab 02','Dr. Fatima Juma')
on conflict (id) do nothing;

insert into public.monitored_students (id, name, email, stream_id, year, attendance_pct, assignments_done, assignments_total, last_active, risk) values
('st-1','Ezekiel M.','ezekiel@student.dit.ac.tz','BENG24COE-1',3,92,4,5,'2026-09-18T08:40:00+00', 'low'),
('st-2','Neema S.','neema@student.dit.ac.tz','BENG24COE-1',3,78,3,5,'2026-09-17T21:10:00+00', 'medium'),
('st-3','Joseph K.','joseph@student.dit.ac.tz','BENG24COE-1',3,64,2,5,'2026-09-14T16:00:00+00', 'high'),
('st-4','Fatuma A.','fatuma@student.dit.ac.tz','BENG24COE-2',3,88,5,5,'2026-09-18T07:55:00+00', 'low'),
('st-5','Brian O.','brian@student.dit.ac.tz','BENG24COE-3',3,71,3,5,'2026-09-16T19:20:00+00', 'medium'),
('st-6','Grace L.','grace@student.dit.ac.tz','BENG24COE-4',3,95,5,5,'2026-09-18T09:02:00+00', 'low'),
('st-7','Daniel T.','daniel@student.dit.ac.tz','BENG24COE-2',3,58,1,5,'2026-09-12T22:00:00+00', 'high'),
('st-8','Sarah N.','sarah@student.dit.ac.tz','BENG24COE-3',3,84,4,5,'2026-09-17T13:30:00+00', 'low')
on conflict (id) do nothing;

insert into public.issues (id, title, description, category, severity, status, stream_id, module_id, reported_by, assignee, created_at, updated_at) values
('iss-1','Missing DSP lecture notes for Topic 04','Students cannot find the Fourier transform notes uploaded last week.','materials','high','open','BENG24COE-1','mod-dsp','Joseph K.','Amina Hassan','2026-09-17T09:20:00+00','2026-09-17T09:20:00+00'),
('iss-2','Lab 03 clash on Thursday morning','Sensor Networks and Electronics both booked Lab 03 at 10:00 for Stream 3.','timetable','high','in_progress','BENG24COE-3',null,'CR · Stream 3','Admin Desk','2026-09-16T14:10:00+00','2026-09-18T08:05:00+00'),
('iss-3','Assignment PDF corrupted','Database Admin assignment file fails to open on mobile.','assignment','medium','open','BENG24COE-1','mod-db-admin','Neema S.',null,'2026-09-18T07:40:00+00','2026-09-18T07:40:00+00'),
('iss-4','Evening stream cannot access past papers','BENG24COE-2 students report empty past papers list after login.','technical','medium','in_progress','BENG24COE-2',null,'CR · Stream 2','Admin Desk','2026-09-15T19:30:00+00','2026-09-17T11:00:00+00'),
('iss-5','Attendance lag after Monday labs','12 students marked absent incorrectly for Software Engineering.','attendance','low','resolved','BENG24COE-4','mod-se','CR · Stream 4','Admin Desk','2026-09-14T16:00:00+00','2026-09-16T10:20:00+00'),
('iss-6','Request: upload CAT 1 marking scheme','Class asks for DSA CAT scheme before revision weekend.','materials','medium','open','BENG24COE-1','mod-dsa','Class poll','Amina Hassan','2026-09-18T08:15:00+00','2026-09-18T08:15:00+00')
on conflict (id) do nothing;

-- Seeded demo materials reference bundled placeholder PDFs (file_url).
-- Real uploads store file_path in the `materials` bucket instead.
insert into public.materials (id, title, kind, module_id, stream_id, status, uploaded_by, role, file_url, file_name, mime_type, size_label, downloads, created_at) values
('up-1','Sensor Networks — Routing Protocols notes','notes','mod-sensor-networks','BENG24COE-1','published','Amina Hassan','class_rep','/past-papers/pp-1.pdf','Sensor Networks — Routing Protocols notes.pdf','application/pdf','2.4 MB',86,'2026-09-17T18:22:00+00'),
('up-2','DSA CAT 2025 Past Paper','past_paper','mod-dsa',null,'published','Admin Desk','admin','/past-papers/pp-2.pdf','DSA CAT 2025 Past Paper.pdf','application/pdf','1.1 MB',214,'2026-09-16T11:05:00+00'),
('up-3','DB Admin Assignment 02 brief','assignment','mod-db-admin','BENG24COE-1','processing','Admin Desk','admin','/assignments/schema-brief.pdf','DB Admin Assignment 02 brief.pdf','application/pdf','840 KB',0,'2026-09-18T09:10:00+00'),
('up-4','Evening timetable update · Week 4','timetable',null,'BENG24COE-2','pending','Admin Desk','admin','/assignments/presentation-rubric.pdf','Evening timetable update · Week 4.pdf','application/pdf','120 KB',0,'2026-09-18T08:50:00+00'),
('up-5','HCI Lab slides — Prototyping','slides','mod-hci','BENG24COE-1','published','Amina Hassan','class_rep','/past-papers/pp-1.pdf','HCI Lab slides — Prototyping.pdf','application/pdf','6.8 MB',61,'2026-09-15T20:40:00+00'),
('up-6','Class announcement draft — CAT week','announcement',null,'BENG24COE-1','pending','Amina Hassan','class_rep','/past-papers/pp-2.pdf','Class announcement draft — CAT week.pdf','application/pdf','12 KB',0,'2026-09-18T07:05:00+00')
on conflict (id) do nothing;
