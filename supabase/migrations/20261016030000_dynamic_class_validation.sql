begin;
create or replace function public.enforce_class_rep_capacity()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if new.role = 'class_rep' then
    if new.stream_id is null or not exists(select 1 from public.academic_classes c where c.id=new.stream_id and not c.archived and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1) then
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
create or replace function public.appoint_class_rep(
  student_email text, assigned_stream text, display_name text,
  contact_phone text default null, account_status text default 'active'
) returns public.staff_profiles language plpgsql security definer set search_path = public
as $$ declare target_id uuid; result public.staff_profiles;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if not exists(select 1 from public.academic_classes c where c.id=assigned_stream and not c.archived and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1)
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
create or replace function public.require_material_class()
returns trigger language plpgsql set search_path=public
as $$ begin
 if new.status='published' and (new.stream_id is null or not exists(select 1 from public.academic_classes c where c.id=new.stream_id and not c.archived and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1)) then
  raise exception 'Choose a particular class before publishing.';
 end if;
 if new.programme<>'BENG24COE' or new.year_of_study<>3 or new.semester<>1 then raise exception 'Unsupported course or semester'; end if;
 return new;
end; $$;
create or replace function public.apply_roster_profile_edit()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
 if pg_trigger_depth()>1 then return new; end if;
 if new.profile_id is not null and (new.name is distinct from old.name or new.stream_id is distinct from old.stream_id or new.year is distinct from old.year) then
  if not public.is_admin() and auth.role()='authenticated' then raise exception 'Only an administrator may change a registered student class'; end if;
  if exists(select 1 from public.academic_classes c where c.id=new.stream_id and not c.archived and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1) and new.year=3 then
   update public.profiles set full_name=new.name,class_name=new.stream_id,year_of_study=3,semester=1,
    institution='Dar es Salaam Institute of Technology (DIT)',programme='BENG24COE',onboarding_completed=true where id=new.profile_id;
  else
   update public.profiles set full_name=new.name,class_name=nullif(new.stream_id,'Unassigned'),year_of_study=new.year,onboarding_completed=false where id=new.profile_id;
  end if;
 end if;
 return new;
end; $$;

commit;
