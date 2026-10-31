create table public.helpdesk_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null check (char_length(trim(sender_name)) between 1 and 100),
  category text not null check (category in ('question', 'feedback', 'review')),
  subject text not null check (char_length(trim(subject)) between 1 and 150),
  message text not null check (char_length(trim(message)) between 1 and 3000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  admin_reply text not null default '' check (char_length(admin_reply) <= 3000),
  created_at timestamptz not null default now()
);
create index helpdesk_requests_user_created_idx on public.helpdesk_requests(user_id, created_at desc, id);
create index helpdesk_requests_created_idx on public.helpdesk_requests(created_at desc, id);
alter table public.helpdesk_requests enable row level security;
revoke all on public.helpdesk_requests from anon, authenticated;
grant select on public.helpdesk_requests to authenticated;
grant insert (user_id, sender_name, category, subject, message) on public.helpdesk_requests to authenticated;
grant update (status, admin_reply) on public.helpdesk_requests to authenticated;
grant all on public.helpdesk_requests to service_role;
create policy "Helpdesk own submissions" on public.helpdesk_requests for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'open' and admin_reply = '');
create policy "Helpdesk private reading" on public.helpdesk_requests for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy "Helpdesk admin responses" on public.helpdesk_requests for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
