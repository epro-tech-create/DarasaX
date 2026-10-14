-- Staff membership cannot be selected through public signup or user metadata.
begin;
drop policy if exists "Staff profiles self-registration" on public.staff_profiles;
create policy "Staff profiles inserted by admin" on public.staff_profiles
for insert to authenticated with check (public.is_admin());

-- New accounts are always students. Staff are appointed after verification.
create or replace function public.handle_new_staff()
returns trigger language plpgsql security definer set search_path = public
as $$ begin return new; end; $$;

-- Block self-service changes to role, status and teaching/class scope even if an
-- overly permissive existing UPDATE policy would otherwise allow the change.
create or replace function public.guard_staff_membership()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if auth.role() = 'authenticated' and not public.is_admin() then
    if tg_op = 'INSERT' then raise exception 'Administrator appointment required'; end if;
    if new.role is distinct from old.role or new.status is distinct from old.status
      or new.stream_id is distinct from old.stream_id
      or new.stream_ids is distinct from old.stream_ids
      or new.module_ids is distinct from old.module_ids then
      raise exception 'Administrator approval required for staff access changes';
    end if;
  end if;
  return new;
end; $$;
create trigger staff_membership_guard before insert or update on public.staff_profiles
for each row execute function public.guard_staff_membership();

create or replace function public.my_staff_role()
returns text language sql stable security definer set search_path = public
as $$ select role::text from public.staff_profiles where id = auth.uid() and status = 'active'; $$;
create or replace function public.my_stream()
returns text language sql stable security definer set search_path = public
as $$ select stream_id from public.staff_profiles where id = auth.uid() and status = 'active'; $$;
create or replace function public.my_stream_ids()
returns text[] language sql stable security definer set search_path = public
as $$ select case when role = 'class_rep' then array[stream_id] else stream_ids end
from public.staff_profiles where id = auth.uid() and status = 'active'; $$;
create or replace function public.my_module_ids()
returns text[] language sql stable security definer set search_path = public
as $$ select module_ids from public.staff_profiles where id = auth.uid() and status = 'active'; $$;

create or replace function public.appoint_class_rep(
  student_email text, assigned_stream text, display_name text,
  contact_phone text default null, account_status text default 'active'
) returns public.staff_profiles language plpgsql security definer set search_path = public
as $$ declare target_id uuid; result public.staff_profiles;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if assigned_stream not in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4')
    or account_status not in ('active','inactive') or length(trim(display_name)) = 0 then
    raise exception 'Invalid appointment details';
  end if;
  perform pg_advisory_xact_lock(hashtext('darasax-cr-appointments'));
  select u.id into target_id from auth.users u join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(student_email)) and u.email_confirmed_at is not null;
  if target_id is null then raise exception 'Verified student account required'; end if;
  if exists(select 1 from public.staff_profiles where id = target_id and role <> 'class_rep') then
    raise exception 'This account already has a different staff role';
  end if;
  if account_status = 'active' and exists(select 1 from public.staff_profiles
    where role = 'class_rep' and status = 'active' and stream_id = assigned_stream and id <> target_id) then
    raise exception 'This stream already has an active representative';
  end if;
  insert into public.staff_profiles(id,role,email,full_name,stream_id,stream_ids,module_ids,onboarding_completed,phone,status)
  values(target_id,'class_rep',lower(trim(student_email)),trim(display_name),assigned_stream,array[assigned_stream],'{}',true,contact_phone,account_status)
  on conflict(id) do update set full_name = excluded.full_name, stream_id = excluded.stream_id,
    stream_ids = excluded.stream_ids, phone = excluded.phone, status = excluded.status
  returning * into result;
  insert into public.audit_log(actor,role,action,summary,detail,stream_id)
  values(auth.uid()::text,'admin','cr_add','Appointed class representative',target_id::text,assigned_stream);
  return result;
end; $$;
revoke all on function public.appoint_class_rep(text,text,text,text,text) from public, anon;
grant execute on function public.appoint_class_rep(text,text,text,text,text) to authenticated;
commit;
