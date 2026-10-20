insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('categories', 'categories', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public reads category images" on storage.objects;
create policy "public reads category images"
on storage.objects for select
to public
using (bucket_id = 'categories');

drop policy if exists "authorized owner uploads category images" on storage.objects;
create policy "authorized owner uploads category images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'categories'
  and exists (
    select 1 from public.app_authorized_users a
    where a.user_id = (select auth.uid()) and a.is_active
  )
);

drop policy if exists "authorized owner updates category images" on storage.objects;
create policy "authorized owner updates category images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'categories'
  and exists (
    select 1 from public.app_authorized_users a
    where a.user_id = (select auth.uid()) and a.is_active
  )
)
with check (
  bucket_id = 'categories'
  and exists (
    select 1 from public.app_authorized_users a
    where a.user_id = (select auth.uid()) and a.is_active
  )
);

drop policy if exists "authorized owner deletes category images" on storage.objects;
create policy "authorized owner deletes category images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'categories'
  and exists (
    select 1 from public.app_authorized_users a
    where a.user_id = (select auth.uid()) and a.is_active
  )
);