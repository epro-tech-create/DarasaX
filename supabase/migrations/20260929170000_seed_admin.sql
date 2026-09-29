-- Promote the programme admin if that Auth user already exists.
-- Create the Auth user first (Supabase → Authentication → Users → Add user):
--   email: admin@darasax.app
--   auto-confirm: on
-- A student email cannot become this login. Staff portals only accept staff_profiles.role.

insert into public.staff_profiles (id, email, full_name, role, status)
select u.id, u.email, 'Admin Desk', 'admin', 'active'
from auth.users u
where lower(u.email) = 'admin@darasax.app'
on conflict (id) do update
set
  role = 'admin',
  status = 'active',
  email = excluded.email,
  full_name = coalesce(public.staff_profiles.full_name, 'Admin Desk');
