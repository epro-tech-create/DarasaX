begin;
create table public.material_shares (
 token uuid primary key default gen_random_uuid(),
 material_id text not null unique references public.materials(id) on delete cascade,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
alter table public.material_shares enable row level security;
revoke all on public.material_shares from anon,authenticated;
create function public.create_material_share(mid text) returns uuid
language plpgsql security definer set search_path=public
as $$ declare result uuid; begin
 if auth.uid() is null or not exists(select 1 from public.materials m where m.id=mid and m.status='published' and m.kind in ('notes','slides','assignment','past_paper') and m.file_path is not null and (public.staff_material_scope(m.stream_id,m.module_id) or (m.stream_id=public.active_student_stream() and m.programme='BENG24COE' and m.year_of_study=3 and m.semester=1))) then raise exception 'Sharing is not available for this material' using errcode='42501'; end if;
 insert into public.material_shares(material_id,created_by) values(mid,auth.uid()) on conflict(material_id) do update set material_id=excluded.material_id returning token into result;
 return result;
end; $$;
create function public.get_shared_material(share_token uuid) returns jsonb
language sql stable security definer set search_path=public
as $$ select jsonb_build_object('id',m.id,'title',m.title,'kind',m.kind,'body',null,'file_path',m.file_path,'file_name',m.file_name,'mime_type',m.mime_type,'size',m.size_label,'module_id',m.module_id,'created_at',m.created_at)
 from public.material_shares s join public.materials m on m.id=s.material_id
 where s.token=share_token and m.status='published' and m.kind in ('notes','slides','assignment','past_paper') and m.file_path is not null; $$;
create function public.shared_material_file_access(object_name text) returns boolean
language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.material_shares s join public.materials m on m.id=s.material_id
 where s.token::text=(coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-material-share') and m.file_path=object_name and m.status='published' and m.kind in ('notes','slides','assignment','past_paper')); $$;
revoke all on function public.create_material_share(text) from public,anon;
grant execute on function public.create_material_share(text) to authenticated;
revoke all on function public.get_shared_material(uuid),public.shared_material_file_access(text) from public;
grant execute on function public.get_shared_material(uuid),public.shared_material_file_access(text) to anon,authenticated;
create policy "Share token grants access to one published file" on storage.objects for select to anon,authenticated using(bucket_id='materials' and public.shared_material_file_access(name));
commit;
