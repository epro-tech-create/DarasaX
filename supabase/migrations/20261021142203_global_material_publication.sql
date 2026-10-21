begin;

-- Publishing across classes is distinct from permission to manage their files.
create function public.can_publish_material(target_stream text,target_module text default null)
returns boolean language sql stable security invoker set search_path=''
as $$ select exists(select 1 from public.staff_profiles s where s.id=auth.uid() and s.status='active'
 and ((s.role='admin' and public.is_admin()) or s.role='class_rep'
   or (s.role='lecturer' and (target_module is null or target_module=any(s.module_ids)))))
 and (target_stream is null or exists(select 1 from public.academic_classes c where c.id=target_stream and not c.archived
   and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1)); $$;
revoke all on function public.can_publish_material(text,text) from public,anon;
grant execute on function public.can_publish_material(text,text) to authenticated;

create function public.can_manage_material(owner_id uuid,target_stream text,target_module text default null)
returns boolean language sql stable security invoker set search_path=''
as $$ select public.staff_material_scope(target_stream,target_module)
 or (owner_id=auth.uid() and public.can_publish_material(target_stream,target_module)); $$;
revoke all on function public.can_manage_material(uuid,text,text) from public,anon;
grant execute on function public.can_manage_material(uuid,text,text) to authenticated;

create function public.can_read_material(owner_id uuid,target_stream text,target_module text,material_status text,programme text,year_of_study integer,semester integer)
returns boolean language sql stable security invoker set search_path=''
as $$ select public.can_manage_material(owner_id,target_stream,target_module)
 or (material_status='published' and target_stream is null and public.can_publish_material(null,target_module))
 or (material_status='published' and public.active_student_stream() is not null
   and (target_stream is null or target_stream=public.active_student_stream())
   and programme='BENG24COE' and year_of_study=3 and semester=1); $$;
revoke all on function public.can_read_material(uuid,text,text,text,text,integer,integer) from public,anon;
grant execute on function public.can_read_material(uuid,text,text,text,text,integer,integer) to authenticated;

create or replace function public.require_material_class() returns trigger language plpgsql set search_path=''
as $$ begin
 if new.status='published' and new.stream_id is not null and not exists(select 1 from public.academic_classes c where c.id=new.stream_id and not c.archived
   and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1) then
   raise exception 'Choose an active class or all streams.';
 end if;
 if new.programme<>'BENG24COE' or new.year_of_study<>3 or new.semester<>1 then raise exception 'Unsupported course or semester'; end if;
 return new;
end; $$;

create function public.guard_material_author() returns trigger language plpgsql set search_path=''
as $$ begin
 if current_user in ('authenticated','anon') and not public.is_admin() then
   if new.uploaded_by_id is distinct from old.uploaded_by_id or new.role is distinct from old.role then
     raise exception 'The uploader identity cannot be changed';
   end if;
 end if;
 return new;
end; $$;
create trigger material_author_guard before update on public.materials for each row execute function public.guard_material_author();

drop policy "Class materials inserted by scoped staff" on public.materials;
create policy "Class materials inserted by scoped staff" on public.materials for insert to authenticated
 with check(uploaded_by_id=auth.uid() and role::text=public.my_staff_role() and public.can_publish_material(stream_id,module_id));
drop policy "Class materials readable by authorized users" on public.materials;
create policy "Class materials readable by authorized users" on public.materials for select to authenticated
 using(public.can_read_material(uploaded_by_id,stream_id,module_id,status::text,programme,year_of_study,semester));
drop policy "Class materials updated by scoped staff" on public.materials;
create policy "Class materials updated by scoped staff" on public.materials for update to authenticated
 using(public.can_manage_material(uploaded_by_id,stream_id,module_id))
 with check(public.can_manage_material(uploaded_by_id,stream_id,module_id));
drop policy "Class materials deleted by scoped staff" on public.materials;
create policy "Class materials deleted by scoped staff" on public.materials for delete to authenticated
 using(public.can_manage_material(uploaded_by_id,stream_id,module_id));

create or replace function public.get_shared_material(share_token uuid) returns jsonb language sql stable security definer set search_path=''
as $$ select jsonb_build_object('id',m.id,'title',m.title,'kind',m.kind,'body',null,'file_path',m.file_path,
 'file_name',m.file_name,'mime_type',m.mime_type,'size',m.size_label,'module_id',m.module_id,'created_at',m.created_at)
 from public.material_shares s join public.materials m on m.id=s.material_id
 where auth.uid() is not null and s.token=share_token and m.status='published'
 and m.kind in ('notes','slides','assignment','past_paper') and m.file_path is not null
 and public.can_read_material(m.uploaded_by_id,m.stream_id,m.module_id,m.status::text,m.programme,m.year_of_study,m.semester); $$;

create or replace function public.create_material_share(mid text) returns uuid language plpgsql security definer set search_path=''
as $$ declare result uuid; begin
 if auth.uid() is null or not exists(select 1 from public.materials m where m.id=mid and m.status='published'
   and m.kind in ('notes','slides','assignment','past_paper') and m.file_path is not null
   and public.can_read_material(m.uploaded_by_id,m.stream_id,m.module_id,m.status::text,m.programme,m.year_of_study,m.semester)) then
   raise exception 'Sharing is not available for this material' using errcode='42501';
 end if;
 insert into public.material_shares(material_id,created_by) values(mid,auth.uid())
 on conflict(material_id) do update set material_id=excluded.material_id returning token into result;
 return result;
end; $$;

create or replace function public.increment_material_downloads(mid text) returns void language plpgsql security definer set search_path=''
as $$ begin
 if not exists(select 1 from public.materials m where m.id=mid and public.can_read_material(m.uploaded_by_id,m.stream_id,m.module_id,m.status::text,m.programme,m.year_of_study,m.semester)) then
   raise exception 'This file is not available to your class';
 end if;
 update public.materials set downloads=downloads+1 where id=mid;
end; $$;
commit;
