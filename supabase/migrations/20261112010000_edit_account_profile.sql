create function public.update_my_staff_name(display_name text)
returns void language plpgsql security invoker set search_path = '' as $$
declare cleaned text := btrim(display_name);
begin
  if cleaned is null or char_length(cleaned) not between 2 and 120 then
    raise exception 'Enter a name between 2 and 120 characters.';
  end if;
  update public.staff_profiles set full_name = cleaned
  where id = auth.uid() and status = 'active';
  if not found then raise exception 'Active staff access required' using errcode = '42501'; end if;
  update public.profiles set full_name = cleaned
  where id = auth.uid()
    and exists (select 1 from public.staff_profiles where id = auth.uid() and role = 'class_rep');
end;
$$;
revoke all on function public.update_my_staff_name(text) from public, anon;
grant execute on function public.update_my_staff_name(text) to authenticated;

create function private.sync_verified_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.staff_profiles set email = new.email where id = new.id and email is distinct from new.email;
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end;
$$;
revoke all on function private.sync_verified_profile_email() from public, anon, authenticated;
create trigger auth_sync_verified_profile_email after update of email on auth.users
for each row when (old.email is distinct from new.email and new.email is not null and new.email_confirmed_at is not null)
execute function private.sync_verified_profile_email();
