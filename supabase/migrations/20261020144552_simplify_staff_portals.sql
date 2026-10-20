begin;
create or replace function public.add_academic_class(class_id text,class_label text,class_institution text,class_programme text,class_year integer,class_semester integer,evening boolean default false) returns void
language plpgsql security definer set search_path=public
as $$ begin
 if not exists(select 1 from public.staff_profiles where id=auth.uid() and role='admin' and status='active') then raise exception 'Not authorized' using errcode='42501'; end if;
 insert into public.academic_classes(id,label,institution,programme,year,semester,is_evening,created_by)
 values(upper(trim(class_id)),trim(class_label),trim(class_institution),upper(trim(class_programme)),class_year,class_semester,evening,auth.uid());
end; $$;
create or replace function public.archive_academic_class(class_id text) returns void
language plpgsql security definer set search_path=public
as $$ begin
 if not exists(select 1 from public.staff_profiles where id=auth.uid() and status='active' and role='admin') then raise exception 'Administrator access required' using errcode='42501'; end if;
 update public.academic_classes set archived=true where id=class_id;
end; $$;
commit;
