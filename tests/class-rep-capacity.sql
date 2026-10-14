begin;
-- Use existing memberships as transaction-only fixtures; rollback restores all data.
do $$
declare ids uuid[]; blocked boolean := false;
begin
  select array_agg(id) into ids from (select id from public.staff_profiles where role='lecturer' order by id limit 3) x;
  if cardinality(ids) < 3 then raise exception 'Three fixture memberships are required'; end if;
  update public.staff_profiles set status='inactive' where role='class_rep';
  update public.staff_profiles set role='class_rep',status='active',stream_id='BENG24COE-4' where id=ids[1];
  update public.staff_profiles set role='class_rep',status='active',stream_id='BENG24COE-4' where id=ids[2];
  if (select count(*) from public.staff_profiles where role='class_rep' and status='active' and stream_id='BENG24COE-4') <> 2 then
    raise exception 'Two representatives were not retained';
  end if;
  begin
    update public.staff_profiles set role='class_rep',status='active',stream_id='BENG24COE-4' where id=ids[3];
  exception when check_violation then blocked := true; end;
  if not blocked then raise exception 'Third active CR was allowed'; end if;
  update public.staff_profiles set role='class_rep',status='inactive',stream_id='BENG24COE-4' where id=ids[3];
  blocked := false;
  begin
    update public.staff_profiles set status='active' where id=ids[3];
  exception when check_violation then blocked := true; end;
  if not blocked then raise exception 'Third CR activation was allowed'; end if;
  update public.staff_profiles set status='inactive' where id=ids[2];
  update public.staff_profiles set status='active' where id=ids[3];
  update public.staff_profiles set stream_id='BENG24COE-3' where id=ids[1];
  if (select stream_ids from public.staff_profiles where id=ids[1]) <> array['BENG24COE-3'] then
    raise exception 'Class permissions did not follow class move';
  end if;
end $$;
rollback;
