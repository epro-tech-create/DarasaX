-- Lecturer teaching scope: classes (streams) + modules + onboarding flag.
-- Also fix materials RLS so lecturers can publish to their assigned streams.

alter table public.staff_profiles
  add column if not exists stream_ids text[] not null default '{}'::text[],
  add column if not exists module_ids text[] not null default '{}'::text[],
  add column if not exists onboarding_completed boolean not null default false;

-- Backfill: admin + CR are already "onboarded"; CR stream → stream_ids
update public.staff_profiles
set
  onboarding_completed = true,
  stream_ids = case
    when role = 'class_rep' and stream_id is not null then array[stream_id]
    else stream_ids
  end
where role in ('admin', 'class_rep');

-- Lecturers who somehow already have modules/streams stay ready
update public.staff_profiles
set onboarding_completed = true
where role = 'lecturer'
  and cardinality(module_ids) > 0
  and cardinality(stream_ids) > 0;

create or replace function public.my_stream_ids()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select case
    when role = 'class_rep' and stream_id is not null then array[stream_id]
    when cardinality(coalesce(stream_ids, '{}'::text[])) > 0 then stream_ids
    when stream_id is not null then array[stream_id]
    else '{}'::text[]
  end
  from public.staff_profiles
  where id = auth.uid();
$$;

create or replace function public.my_module_ids()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(module_ids, '{}'::text[])
  from public.staff_profiles
  where id = auth.uid();
$$;

-- Materials: staff may write when stream is null, matches CR stream, or is in lecturer stream_ids
drop policy if exists "Materials writable by staff in scope" on public.materials;
create policy "Materials writable by staff in scope"
on public.materials
for all
using (
  public.is_admin()
  or (
    public.is_staff()
    and (
      stream_id is null
      or stream_id = public.my_stream()
      or stream_id = any (public.my_stream_ids())
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_staff()
    and (
      stream_id is null
      or stream_id = public.my_stream()
      or stream_id = any (public.my_stream_ids())
    )
  )
);

-- Keep signup trigger: lecturers start with empty scope until onboarding
create or replace function public.handle_new_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role text := coalesce(new.raw_user_meta_data->>'role', '');
  stream text := new.raw_user_meta_data->>'stream_id';
  full_name text := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
begin
  if staff_role in ('admin', 'class_rep', 'lecturer') then
    insert into public.staff_profiles (
      id, email, full_name, role, stream_id, stream_ids, module_ids, onboarding_completed
    )
    values (
      new.id,
      new.email,
      full_name,
      staff_role::public.staff_role,
      case when staff_role = 'class_rep' then stream else null end,
      case
        when staff_role = 'class_rep' and stream is not null then array[stream]
        else '{}'::text[]
      end,
      '{}'::text[],
      staff_role in ('admin', 'class_rep')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
