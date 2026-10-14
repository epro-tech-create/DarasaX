begin;
-- Enforce capacity on every insert, activation and class move, including direct API writes.
create or replace function public.enforce_class_rep_capacity()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if new.role = 'class_rep' then
    if new.stream_id is null or new.stream_id not in ('BENG24COE-1','BENG24COE-2','BENG24COE-3','BENG24COE-4') then
      raise exception 'Select a valid class';
    end if;
    new.stream_ids := array[new.stream_id];
    if new.status = 'active' then
      perform pg_advisory_xact_lock(hashtext('darasax-cr-appointments'));
      if (select count(*) from public.staff_profiles
        where role = 'class_rep' and status = 'active'
          and stream_id = new.stream_id and id <> new.id) >= 2 then
        raise exception using errcode = '23514', message = 'This class already has two active representatives';
      end if;
    end if;
  end if;
  return new;
end; $$;
create trigger staff_class_rep_capacity before insert or update on public.staff_profiles
for each row execute function public.enforce_class_rep_capacity();

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
  insert into public.staff_profiles(id,role,email,full_name,stream_id,stream_ids,module_ids,onboarding_completed,phone,status)
  values(target_id,'class_rep',lower(trim(student_email)),trim(display_name),assigned_stream,array[assigned_stream],'{}',true,contact_phone,account_status)
  on conflict(id) do update set full_name = excluded.full_name, stream_id = excluded.stream_id,
    stream_ids = excluded.stream_ids, phone = excluded.phone, status = excluded.status
  returning * into result;
  insert into public.audit_log(actor,role,action,summary,detail,stream_id)
  values(auth.uid()::text,'admin','cr_add','Appointed class representative',target_id::text,assigned_stream);
  return result;
end; $$;
commit;
