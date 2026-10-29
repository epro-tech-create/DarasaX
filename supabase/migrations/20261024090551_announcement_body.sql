-- Text announcements use the existing material permissions and notifications.
alter table public.materials add column if not exists body text;
notify pgrst, 'reload schema';
