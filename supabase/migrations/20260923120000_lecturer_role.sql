-- Add lecturer to staff_role and allow staff signup trigger for lecturers.

do $$ begin
  alter type public.staff_role add value if not exists 'lecturer';
exception
  when duplicate_object then null;
  when others then
    -- Older Postgres: try without IF NOT EXISTS
    begin
      alter type public.staff_role add value 'lecturer';
    exception when duplicate_object then null;
    end;
end $$;

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
    insert into public.staff_profiles (id, email, full_name, role, stream_id)
    values (
      new.id,
      new.email,
      full_name,
      staff_role::public.staff_role,
      case when staff_role = 'class_rep' then stream else null end
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
