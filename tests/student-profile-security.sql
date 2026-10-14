begin;
select set_config('request.jwt.claim.sub', (select id::text from public.profiles limit 1), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
insert into storage.objects(bucket_id,name) values('avatars','00000000-0000-0000-0000-000000000000/hidden.webp');
set local role authenticated;
do $$
declare own_path text := auth.uid()::text || '/security-test.webp'; blocked boolean := false; changed integer;
begin
  if auth.uid() is null then raise exception 'A student profile is required'; end if;
  insert into storage.objects(bucket_id,name) values('avatars',own_path);
  if not exists(select 1 from storage.objects where bucket_id='avatars' and name=own_path) then raise exception 'Owner cannot read avatar'; end if;
  begin
    insert into storage.objects(bucket_id,name) values('avatars','00000000-0000-0000-0000-000000000000/foreign.webp');
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Cross-user avatar upload allowed'; end if;
  update public.profiles set full_name=full_name where id<>auth.uid();
  get diagnostics changed = row_count;
  if changed<>0 then raise exception 'Cross-user profile update allowed'; end if;
  if exists(select 1 from storage.objects where bucket_id='avatars' and name='00000000-0000-0000-0000-000000000000/hidden.webp') then raise exception 'Cross-user avatar read allowed'; end if;
end $$;
rollback;
