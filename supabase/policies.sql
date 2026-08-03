-- Ledger V1 — policies.sql
-- Run this AFTER schema.sql, also in the Supabase SQL Editor.
-- Enables Row Level Security on every table and restricts all access
-- (select/insert/update/delete) to rows owned by the requesting user.

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.sessions enable row level security;
alter table public.trades enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.journal_entries enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.daily_focus enable row level security;

-- profiles: a user can read/update only their own profile row.
-- (Inserts happen via the handle_new_user trigger, not the client.)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- settings
drop policy if exists "settings_all_own" on public.settings;
create policy "settings_all_own" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sessions
drop policy if exists "sessions_all_own" on public.sessions;
create policy "sessions_all_own" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- trades
drop policy if exists "trades_all_own" on public.trades;
create policy "trades_all_own" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- weekly_reviews
drop policy if exists "weekly_reviews_all_own" on public.weekly_reviews;
create policy "weekly_reviews_all_own" on public.weekly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- journal_entries
drop policy if exists "journal_entries_all_own" on public.journal_entries;
create policy "journal_entries_all_own" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- daily_checkins
drop policy if exists "daily_checkins_all_own" on public.daily_checkins;
create policy "daily_checkins_all_own" on public.daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- daily_focus
drop policy if exists "daily_focus_all_own" on public.daily_focus;
create policy "daily_focus_all_own" on public.daily_focus
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- habits
alter table public.habits enable row level security;
drop policy if exists "habits_all_own" on public.habits;
create policy "habits_all_own" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- habit_logs
alter table public.habit_logs enable row level security;
drop policy if exists "habit_logs_all_own" on public.habit_logs;
create policy "habit_logs_all_own" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
