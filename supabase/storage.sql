-- Ledger V1 — storage.sql
-- Run this in the Supabase SQL Editor, after schema.sql and policies.sql.
-- Creates a private bucket for trade screenshots and locks access so a
-- user can only read/write/delete files inside their own folder
-- (path convention: {user_id}/{trade_id}.{ext}).

insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', false)
on conflict (id) do nothing;

drop policy if exists "trade_screenshots_select_own" on storage.objects;
create policy "trade_screenshots_select_own" on storage.objects
  for select using (
    bucket_id = 'trade-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "trade_screenshots_insert_own" on storage.objects;
create policy "trade_screenshots_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'trade-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "trade_screenshots_update_own" on storage.objects;
create policy "trade_screenshots_update_own" on storage.objects
  for update using (
    bucket_id = 'trade-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "trade_screenshots_delete_own" on storage.objects;
create policy "trade_screenshots_delete_own" on storage.objects
  for delete using (
    bucket_id = 'trade-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
