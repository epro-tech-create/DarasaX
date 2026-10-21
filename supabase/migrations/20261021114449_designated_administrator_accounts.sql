begin;

create schema if not exists private;

-- Invitations are operator-managed. Browser clients cannot list or change them.
create table private.administrator_invitations (
 email text primary key check(email=lower(trim(email))),
 user_id uuid unique references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
alter table private.administrator_invitations enable row level security;
revoke all on private.administrator_invitations from public,anon,authenticated;
insert into private.administrator_invitations(email) values
 ('allandavinc89@gmail.com'),('eprocreativ12@gmail.com');

create function private.claim_administrator_invitation(target_user uuid) returns void
language plpgsql security definer set search_path=''
as $$ declare person auth.users; invitation private.administrator_invitations;
begin
 select * into person from auth.users where id=target_user;
 if person.email_confirmed_at is null then return; end if;
 if person.last_sign_in_at is null and coalesce(person.encrypted_password,'')='' then return; end if;
 select * into invitation from private.administrator_invitations
 where email=lower(person.email) for update;
 if not found or (invitation.user_id is not null and invitation.user_id<>target_user) then return; end if;
 if exists(select 1 from public.staff_profiles where id=target_user and role<>'admin') then
   raise exception 'This invitation conflicts with an existing staff role';
 end if;
 update private.administrator_invitations set user_id=target_user where email=invitation.email;
 insert into public.staff_profiles(id,email,full_name,role,status,onboarding_completed)
 values(target_user,person.email,left(coalesce(nullif(person.raw_user_meta_data->>'full_name',''),'Administrator'),200),'admin','active',true)
 on conflict(id) do nothing;
end; $$;
revoke all on function private.claim_administrator_invitation(uuid) from public,anon,authenticated;

create function private.sync_administrator_invitation() returns trigger
language plpgsql security definer set search_path=''
as $$ begin
 -- A bound administrator loses privileges if their verified address changes.
 if exists(select 1 from private.administrator_invitations where user_id=new.id)
 and not exists(select 1 from private.administrator_invitations where user_id=new.id and email=lower(new.email) and new.email_confirmed_at is not null) then
   update public.staff_profiles set status='inactive' where id=new.id and role='admin';
   delete from private.admin_verified_sessions where user_id=new.id;
   delete from private.admin_trusted_browsers where user_id=new.id;
   delete from private.admin_email_challenges where user_id=new.id;
 end if;
 perform private.claim_administrator_invitation(new.id);
 return new;
end; $$;
revoke all on function private.sync_administrator_invitation() from public,anon,authenticated;
create trigger on_auth_user_designated_administrator
after insert or update of email,email_confirmed_at,last_sign_in_at on auth.users
for each row execute function private.sync_administrator_invitation();

-- Allan's email is ready: promote his verified account.
select private.claim_administrator_invitation(id) from auth.users
where lower(email) = 'allandavinc89@gmail.com';

-- Remove pre-existing password/sessions from eprocreativ12@gmail.com so it binds on first sign in.
update auth.users set encrypted_password = null where lower(email) = 'eprocreativ12@gmail.com';
delete from auth.sessions where user_id in (select id from auth.users where lower(email) = 'eprocreativ12@gmail.com');
delete from private.admin_verified_sessions where user_id in (select id from auth.users where lower(email) = 'eprocreativ12@gmail.com');
delete from private.admin_trusted_browsers where user_id in (select id from auth.users where lower(email) = 'eprocreativ12@gmail.com');
delete from private.admin_email_challenges where user_id in (select id from auth.users where lower(email) = 'eprocreativ12@gmail.com');
update private.administrator_invitations set user_id = null where email = 'eprocreativ12@gmail.com';
delete from public.staff_profiles where lower(email) = 'eprocreativ12@gmail.com' and role = 'admin';

-- Remove the retired login's workspace access while preserving its records.
update public.staff_profiles s set status='inactive'
from auth.users u where u.id=s.id and lower(u.email)='admin@darasax.app' and s.role='admin';
delete from private.admin_verified_sessions where user_id in (select id from auth.users where lower(email)='admin@darasax.app');
delete from private.admin_trusted_browsers where user_id in (select id from auth.users where lower(email)='admin@darasax.app');
delete from private.admin_email_challenges where user_id in (select id from auth.users where lower(email)='admin@darasax.app');
delete from auth.sessions where user_id in (select id from auth.users where lower(email)='admin@darasax.app');
commit;
