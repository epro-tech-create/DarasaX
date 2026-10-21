-- Synthetic local PostgreSQL fixture. Contains no production users or data.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
do $$ begin create role authenticator nologin; exception when duplicate_object then null; end $$;
create schema auth;
create schema storage;
create schema extensions;
create extension pgcrypto with schema extensions;
grant usage on schema auth,public,extensions to authenticated,anon,service_role;
create table auth.users(id uuid primary key,email text,phone text,encrypted_password text,email_confirmed_at timestamptz,raw_user_meta_data jsonb,raw_app_meta_data jsonb,aud text,role text);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);
create table auth.identities(user_id uuid references auth.users(id),provider_id text,identity_data jsonb,provider text);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb; $$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid; $$;
create function auth.role() returns text language sql stable as $$ select auth.jwt()->>'role'; $$;
create type public.staff_role as enum('admin','class_rep','lecturer');
create table public.profiles(id uuid primary key references auth.users(id),email text,full_name text,class_name text,institution text,programme text,year_of_study integer,semester integer,onboarding_completed boolean default false);
create table public.student_admissions(user_id uuid primary key references public.profiles(id),registration_number text,submitted_at timestamptz,status text default 'pending');
create table public.staff_profiles(id uuid primary key references auth.users(id),role public.staff_role not null,email text,full_name text,phone text,status text not null default 'active' check(status in ('active','inactive')),stream_id text,stream_ids text[] not null default '{}',module_ids text[] not null default '{}',onboarding_completed boolean default false,created_at timestamptz default now());
create table public.academic_classes(id text primary key,archived boolean default false,label text,institution text,programme text,year integer,semester integer,is_evening boolean,created_by uuid);
insert into public.academic_classes(id,institution,programme,year,semester) values('BENG24COE-1','Dar es Salaam Institute of Technology (DIT)','BENG24COE',3,1),('BENG24COE-2','Dar es Salaam Institute of Technology (DIT)','BENG24COE',3,1);
create table public.audit_log(id bigint generated always as identity,actor text,role text,action text,summary text,detail text,actor_id uuid);
create table public.materials(id text primary key,title text);
create table public.monitored_students(id text primary key,profile_id uuid,name text,email text,stream_id text,year integer);
insert into public.materials values('private-material','Private material');
create table storage.objects(id uuid default gen_random_uuid(),name text);
alter table public.profiles enable row level security;
alter table public.student_admissions enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.academic_classes enable row level security;
alter table public.audit_log enable row level security;
alter table public.materials enable row level security;
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant all on all tables in schema public,storage to authenticated;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.staff_profiles where id=auth.uid() and role='admin' and status='active'); $$;
create function public.staff_material_scope(target_stream text,target_module text default null) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.staff_profiles s where s.id=auth.uid() and s.status='active' and (s.role='admin' or (s.role='class_rep' and s.stream_id=target_stream) or (s.role='lecturer' and target_stream=any(s.stream_ids) and (target_module is null or target_module=any(s.module_ids))))); $$;
create policy staff_owner on public.staff_profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy staff_update on public.staff_profiles for update to authenticated using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());
create policy material_read on public.materials for select to authenticated using(public.staff_material_scope('BENG24COE-1','mod-web'));
create policy objects_read on storage.objects for select to authenticated using(public.staff_material_scope('BENG24COE-1','mod-web'));
-- Mirrors the current production membership guard. The migration must preserve it.
create function public.guard_staff_membership() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if current_user in ('authenticated','anon') and not public.is_admin() then
  if tg_op='INSERT' then raise exception 'Administrator appointment required'; end if;
  if new.role is distinct from old.role or new.status is distinct from old.status or new.stream_id is distinct from old.stream_id or new.stream_ids is distinct from old.stream_ids or new.module_ids is distinct from old.module_ids then raise exception 'Administrator approval required for staff access changes'; end if;
 end if; return new; end; $$;
create trigger staff_membership_guard before insert or update on public.staff_profiles for each row execute function public.guard_staff_membership();
create function public.handle_fixture_user() returns trigger language plpgsql security definer set search_path='' as $$ begin
 insert into public.profiles(id,email,full_name) values(new.id,new.email,new.raw_user_meta_data->>'full_name');
 insert into public.student_admissions(user_id) values(new.id); return new; end; $$;
create trigger fixture_new_user after insert on auth.users for each row execute function public.handle_fixture_user();
