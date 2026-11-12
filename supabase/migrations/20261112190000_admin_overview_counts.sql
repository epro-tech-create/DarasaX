create function public.admin_overview_counts()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare materials jsonb;
begin
  if not public.is_admin() then
    raise exception 'Verified administrator access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'published', count(*) filter (where status = 'published'),
    'uploads', count(*),
    'downloads', coalesce(sum(downloads), 0)
  ) into materials from public.materials;

  return materials || jsonb_build_object(
    'students', (select count(*) from public.monitored_students),
    'activeCrs', (select count(*) from public.staff_profiles where role = 'class_rep' and status = 'active'),
    'audit', (select count(*) from public.audit_log)
  );
end;
$$;
revoke all on function public.admin_overview_counts() from public, anon;
grant execute on function public.admin_overview_counts() to authenticated;
