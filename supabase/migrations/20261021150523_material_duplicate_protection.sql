begin;
alter table public.materials add column file_fingerprint text check(file_fingerprint is null or file_fingerprint ~ '^v1:[0-9a-f]{64}$');
create unique index materials_unique_filename on public.materials(lower(btrim(file_name))) where nullif(btrim(file_name),'') is not null;
create unique index materials_unique_fingerprint on public.materials(file_fingerprint) where file_fingerprint is not null;
-- The global existence check must cross class RLS, but reveals no file or owner details.
create function public.material_file_exists(candidate_name text,candidate_fingerprint text,exclude_id text default null)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.can_publish_material(null,null) then
   raise exception 'File publishing access required' using errcode='42501';
 end if;
 return exists(select 1 from public.materials m where (exclude_id is null or m.id<>exclude_id)
   and (lower(btrim(m.file_name))=lower(btrim(candidate_name)) or m.file_fingerprint=candidate_fingerprint));
end; $$;
revoke all on function public.material_file_exists(text,text,text) from public,anon;
grant execute on function public.material_file_exists(text,text,text) to authenticated;
commit;
