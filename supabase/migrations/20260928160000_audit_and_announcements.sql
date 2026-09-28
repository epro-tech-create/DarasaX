-- Let every signed-in user write their own audit row, and let admins delete logs.
-- Store announcement body on materials so a post is a real record students can read.

alter table public.materials
  add column if not exists body text;

drop policy if exists "Audit log writable by staff" on public.audit_log;
create policy "Audit log writable by actor"
on public.audit_log for insert to authenticated
with check (
  public.is_staff()
  or actor_id = auth.uid()
);

drop policy if exists "Audit log deletable by admin" on public.audit_log;
create policy "Audit log deletable by admin"
on public.audit_log for delete to authenticated
using (public.is_admin());
