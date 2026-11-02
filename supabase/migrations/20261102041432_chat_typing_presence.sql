begin;
-- Add private, room-scoped typing presence. No stored messages or user records
-- are inserted, modified, or deleted by this migration.
create policy "Students receive typing in their chat rooms" on realtime.messages
 for select to authenticated using (
  extension='presence'
  and starts_with((select realtime.topic()),'darasax:typing:')
  and public.can_chat_in_room(substring((select realtime.topic()) from 16))
 );
create policy "Students publish typing in their chat rooms" on realtime.messages
 for insert to authenticated with check (
  extension='presence'
  and starts_with((select realtime.topic()),'darasax:typing:')
  and public.can_chat_in_room(substring((select realtime.topic()) from 16))
 );
commit;
