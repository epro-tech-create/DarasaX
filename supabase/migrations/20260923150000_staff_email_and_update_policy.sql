-- Fix staff_profiles owner UPDATE so lecturers can finish onboarding
-- (set stream_id / stream_ids / module_ids) and always keep email in sync.
-- Also backfill missing emails from auth.users.

drop policy if exists "Staff profiles updatable by owner (no privilege change)" on public.staff_profiles;
create policy "Staff profiles updatable by owner (no privilege change)"
on public.staff_profiles for update to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role::text = public.my_staff_role()
  and status = 'active'
  and (
    -- Lecturers may set teaching scope (streams / modules) during onboarding
    public.my_staff_role() = 'lecturer'
    -- Class reps / admins: keep stream_id unchanged via self-update
    or stream_id is not distinct from public.my_stream()
  )
);

-- Backfill empty emails from Auth
update public.staff_profiles sp
set email = u.email
from auth.users u
where sp.id = u.id
  and (sp.email is null or sp.email = '')
  and u.email is not null;
