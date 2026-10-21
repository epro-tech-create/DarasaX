begin;
create table public.class_invitations(
  id uuid primary key default gen_random_uuid(),
  code text not null unique default replace(gen_random_uuid()::text,'-',''),
  class_id text not null references public.academic_classes(id),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '7 days',
  revoked_at timestamptz
);
create index class_invitations_creator_idx on public.class_invitations(created_by);
create index class_invitations_class_idx on public.class_invitations(class_id);
alter table public.class_invitations enable row level security;
revoke all on public.class_invitations from public,anon,authenticated;
grant all on public.class_invitations to service_role;
-- Invitations are read and redeemed only through bounded functions.
create function public.resolve_class_invitation(invite_code text) returns jsonb
language sql stable security definer set search_path=public
as $$ select jsonb_build_object('class_name',c.id,'label',c.label,'expires_at',i.expires_at)
from public.class_invitations i join public.academic_classes c on c.id=i.class_id
join public.staff_profiles s on s.id=i.created_by and s.role='class_rep' and s.status='active' and s.stream_id=i.class_id
where i.code=lower(trim(invite_code)) and i.expires_at>now() and i.revoked_at is null
  and not c.archived and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1; $$;
revoke all on function public.resolve_class_invitation(text) from public;
-- Public class label/expiry only; the random 128-bit code is required.
grant execute on function public.resolve_class_invitation(text) to anon,authenticated;
create function public.manage_class_invitation(invite_action text) returns jsonb
language plpgsql security definer set search_path=public
as $$ declare staff public.staff_profiles; invitation public.class_invitations;
begin
  select * into staff from public.staff_profiles where id=auth.uid() and role='class_rep' and status='active' for update;
  if not found then raise exception 'Active class representative access required' using errcode='42501'; end if;
  if not exists(select 1 from public.academic_classes c where c.id=staff.stream_id and not c.archived
    and c.institution='Dar es Salaam Institute of Technology (DIT)' and c.programme='BENG24COE' and c.year=3 and c.semester=1) then raise exception 'Class is unavailable'; end if;
  if invite_action is null or invite_action not in ('get','create','revoke') then raise exception 'Invalid action'; end if;
  if invite_action in ('create','revoke') then
    update public.class_invitations set revoked_at=now() where created_by=auth.uid() and revoked_at is null;
  end if;
  if invite_action='revoke' then return null; end if;
  if invite_action='create' then
    insert into public.class_invitations(class_id,created_by) values(staff.stream_id,auth.uid()) returning * into invitation;
  else
    select * into invitation from public.class_invitations where created_by=auth.uid() and class_id=staff.stream_id
      and revoked_at is null and expires_at>now() order by created_at desc limit 1;
  end if;
  if invitation.id is null then return null; end if;
  return jsonb_build_object('code',invitation.code,'class_name',invitation.class_id,'expires_at',invitation.expires_at);
end; $$;
revoke all on function public.manage_class_invitation(text) from public,anon;
grant execute on function public.manage_class_invitation(text) to authenticated;
create function public.redeem_class_invitation(invite_code text,reg_number text) returns void
language plpgsql security definer set search_path=public
as $$ declare invitation public.class_invitations; person public.profiles; admission public.student_admissions;
begin
  if auth.uid() is null or exists(select 1 from public.staff_profiles where id=auth.uid()) then raise exception 'Student access required' using errcode='42501'; end if;
  select * into person from public.profiles where id=auth.uid() for update;
  select * into admission from public.student_admissions where user_id=auth.uid() for update;
  if not found then raise exception 'Student admission is unavailable'; end if;
  if admission.status in ('rejected','suspended') then raise exception 'Contact your class representative or administrator'; end if;
  select i.* into invitation from public.class_invitations i join public.staff_profiles s on s.id=i.created_by
    where i.code=lower(trim(invite_code)) and i.expires_at>now() and i.revoked_at is null
      and s.status='active' and s.role='class_rep' and s.stream_id=i.class_id for share of i,s;
  if not found then raise exception 'This invitation is invalid, expired or revoked'; end if;
  if person.onboarding_completed and person.class_name is distinct from invitation.class_id then
    raise exception 'Contact your administrator to change your class'; end if;
  -- Reuse all email, class, uniqueness, immutable-number and suspension checks.
  perform public.submit_student_registration(reg_number,invitation.class_id);
  if admission.status<>'approved' then
    update public.student_admissions set status='approved',reviewed_by=invitation.created_by,reviewed_at=now() where user_id=auth.uid();
    update public.profiles set full_name=full_name where id=auth.uid();
    insert into public.audit_log(actor,role,action,summary,stream_id,actor_id)
      values(coalesce(person.full_name,person.email,'Student'),'student','other','Joined class using CR invitation',invitation.class_id,auth.uid());
  end if;
end; $$;
revoke all on function public.redeem_class_invitation(text,text) from public,anon;
grant execute on function public.redeem_class_invitation(text,text) to authenticated;
commit;
