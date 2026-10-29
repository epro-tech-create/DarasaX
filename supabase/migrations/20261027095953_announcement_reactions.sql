create table public.announcement_reactions (
 material_id text not null references public.materials(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 emoji text not null check(emoji in ('👍','❤️','😂','😮','😢','🙏')),
 primary key(material_id,user_id)
);
create index announcement_reactions_user on public.announcement_reactions(user_id);
alter table public.announcement_reactions enable row level security;
revoke all on public.announcement_reactions from public,anon;
grant select,insert,update,delete on public.announcement_reactions to authenticated;
grant all on public.announcement_reactions to service_role;
create policy "Readers can see announcement reactions" on public.announcement_reactions for select to authenticated
using (exists(select 1 from public.materials m where m.id=material_id and m.kind='announcement' and m.status='published'));
create policy "Readers can add their own reaction" on public.announcement_reactions for insert to authenticated
with check(user_id=(select auth.uid()) and exists(select 1 from public.materials m where m.id=material_id and m.kind='announcement' and m.status='published'));
create policy "Readers can change their own reaction" on public.announcement_reactions for update to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.materials m where m.id=material_id and m.kind='announcement' and m.status='published'))
with check(user_id=(select auth.uid()) and exists(select 1 from public.materials m where m.id=material_id and m.kind='announcement' and m.status='published'));
create policy "Readers can remove their own reaction" on public.announcement_reactions for delete to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.materials m where m.id=material_id and m.kind='announcement' and m.status='published'));

create function public.get_announcement_reactions(announcement_ids text[])
returns table(material_id text,emoji text,reaction_count bigint,reacted_by_me boolean)
language sql stable security invoker set search_path='' as $$
 select r.material_id,r.emoji,count(*),bool_or(r.user_id=(select auth.uid()))
 from public.announcement_reactions r
 where r.material_id=any(announcement_ids)
 group by r.material_id,r.emoji;
$$;
create function public.set_announcement_reaction(announcement_id text,reaction_emoji text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise insufficient_privilege using message='Sign in to react'; end if;
 if reaction_emoji is not null and reaction_emoji not in ('👍','❤️','😂','😮','😢','🙏') then raise exception 'Choose a supported reaction'; end if;
 perform 1 from public.materials m where m.id=announcement_id and m.kind='announcement' and m.status='published';
 if not found then raise insufficient_privilege using message='Announcement unavailable'; end if;
 if reaction_emoji is null then
  delete from public.announcement_reactions r where r.material_id=announcement_id and r.user_id=auth.uid();
 else
  insert into public.announcement_reactions(material_id,user_id,emoji) values(announcement_id,auth.uid(),reaction_emoji)
  on conflict(material_id,user_id) do update set emoji=excluded.emoji;
 end if;
end; $$;
revoke all on function public.get_announcement_reactions(text[]),public.set_announcement_reaction(text,text) from public,anon;
grant execute on function public.get_announcement_reactions(text[]),public.set_announcement_reaction(text,text) to authenticated;
