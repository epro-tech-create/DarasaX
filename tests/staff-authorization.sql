begin;
-- Claims simulate an existing CR; all attempted writes are rolled back.
select set_config('request.jwt.claim.sub', (select id::text from public.staff_profiles where role = 'class_rep' and status = 'active' limit 1), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
do $$
declare blocked boolean;
begin
  if auth.uid() is null then raise exception 'An active CR is required for this test'; end if;
  blocked := false;
  begin
    update public.staff_profiles set role = 'admin' where id = auth.uid();
  exception when others then blocked := true; end;
  if not blocked then raise exception 'SECURITY FAILURE: CR could change role'; end if;
  blocked := false;
  begin
    update public.staff_profiles set stream_ids = array['UNAUTHORIZED'] where id = auth.uid();
  exception when others then blocked := true; end;
  if not blocked then raise exception 'SECURITY FAILURE: CR could change scope'; end if;
  blocked := false;
  begin
    perform public.appoint_class_rep('nobody@example.invalid','BENG24COE-1','Unauthorized');
  exception when others then blocked := true; end;
  if not blocked then raise exception 'SECURITY FAILURE: CR could appoint staff'; end if;
end $$;
rollback;
