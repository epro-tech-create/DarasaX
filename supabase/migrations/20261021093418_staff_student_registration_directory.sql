begin;
create function public.list_staff_students() returns jsonb
language plpgsql stable security definer set search_path=public
as $$ declare staff public.staff_profiles;
begin
 select * into staff from public.staff_profiles where id=auth.uid() and status='active' and role in ('admin','class_rep','lecturer');
 if not found then raise exception 'Active staff access required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('registration_number',a.registration_number,'admission_status',a.status) order by m.name,m.id)
   from public.monitored_students m left join public.student_admissions a on a.user_id=m.profile_id
   where staff.role='admin'
     or (staff.role='class_rep' and m.stream_id=staff.stream_id)
     or (staff.role='lecturer' and (m.stream_id=any(staff.stream_ids) or (cardinality(staff.stream_ids)=0 and m.stream_id=staff.stream_id)))), '[]'::jsonb);
end; $$;
revoke all on function public.list_staff_students() from public,anon;
grant execute on function public.list_staff_students() to authenticated;
commit;
