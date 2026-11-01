insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('timetable-import-uploads','timetable-import-uploads',false,10485760,
 array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/pdf','image/jpeg','image/png']);
create policy "Upload assigned timetable documents" on storage.objects for insert to authenticated
with check(bucket_id='timetable-import-uploads' and (storage.foldername(name))[2]=(select auth.uid())::text
 and public.can_import_timetable((storage.foldername(name))[1]));
create policy "Read own assigned timetable documents" on storage.objects for select to authenticated
using(bucket_id='timetable-import-uploads' and (storage.foldername(name))[2]=(select auth.uid())::text
 and public.can_import_timetable((storage.foldername(name))[1]));
create policy "Remove own timetable documents" on storage.objects for delete to authenticated
using(bucket_id='timetable-import-uploads' and (storage.foldername(name))[2]=(select auth.uid())::text
 and public.can_import_timetable((storage.foldername(name))[1]));
