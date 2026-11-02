begin;
-- Read notifications leave the inbox permanently. Source announcements,
-- materials, timetable entries and unread notifications are untouched.
create function private.remove_read_notification() returns trigger
language plpgsql security definer set search_path=''
as $$ begin
 delete from public.notifications
 where id=new.id and recipient_id=new.recipient_id and read_at is not null;
 return null;
end; $$;
revoke all on function private.remove_read_notification() from public,anon,authenticated;
-- Run after the existing row-level push queue trigger. Any delivery for an
-- already-read insert is removed by its existing notification FK cascade.
create trigger zz_remove_read_notification
 after insert or update of read_at on public.notifications
 for each row when (new.read_at is not null)
 execute function private.remove_read_notification();

-- One-time cleanup; no unread rows match this predicate.
delete from public.notifications where read_at is not null;
commit;
