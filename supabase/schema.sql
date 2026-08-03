-- Ledger V1 — schema.sql
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

-- ============================================================
-- profiles — one row per authenticated user, auto-created on signup
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- settings — one row per user: starting balance, trading rules
-- ============================================================
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  starting_balance numeric not null default 0,
  rules jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- sessions — one row per trading session (the pre-session ritual
-- through end-of-session grade). ended_at IS NULL means "in progress"
-- — that's how a second device knows to resume the live screen
-- instead of starting a new session.
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  sleep smallint,
  stress smallint,
  confidence smallint,
  energy smallint,
  objective text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  objective_met boolean,
  grade text,
  narrative jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_date_idx on public.sessions (user_id, date desc);
-- Enforces "at most one in-progress session per user" at the database level.
create unique index if not exists sessions_one_active_per_user
  on public.sessions (user_id)
  where ended_at is null;

-- ============================================================
-- trades — logged during a session (session_id nullable for
-- flexibility, e.g. future manual entry outside a session)
-- ============================================================
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  date date not null,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  entry numeric,
  exit numeric,
  size numeric,
  pnl numeric not null default 0,
  setup text,
  emotions jsonb not null default '[]'::jsonb,
  mistakes jsonb not null default '[]'::jsonb,
  rules_broken jsonb not null default '[]'::jsonb,
  notes text,
  confidence smallint,
  followed_plan boolean,
  -- Storage path (e.g. "{user_id}/{trade_id}.jpg") in the private
  -- trade-screenshots bucket — see supabase/storage.sql. Resolved to a
  -- signed, expiring URL client-side at display time, never stored as a
  -- permanent public URL.
  screenshot_url text,
  created_at timestamptz not null default now()
);

create index if not exists trades_user_date_idx on public.trades (user_id, date desc);
create index if not exists trades_session_idx on public.trades (session_id);

-- ============================================================
-- weekly_reviews — cached Coach reports, one per (user, week).
-- V1 computes these with a rules-based formula (see lib/coach.ts /
-- lib/weekly-review.ts); this table exists so a real AI-generated
-- report can be cached the same way later without a schema change —
-- regenerating on every page load would be wasteful once real
-- generation (with real latency/cost) replaces the formula.
-- ============================================================
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  avg_score numeric,
  sessions_count smallint not null default 0,
  total_trades smallint not null default 0,
  pnl numeric not null default 0,
  objectives_met smallint not null default 0,
  narrative jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ============================================================
-- journal_entries — reserved for the Psychology Journal's return in
-- a later version. Not written to by V1's UI at all today.
-- ============================================================
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  morning jsonb,
  reflection jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ============================================================
-- daily_checkins / daily_focus — reserved, decoupled versions of the
-- ritual data that currently lives on `sessions`. Not written to by
-- V1's UI. Exists now so a future "check in without starting a full
-- session" flow doesn't need a migration.
-- ============================================================
create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  sleep smallint,
  energy smallint,
  stress smallint,
  confidence smallint,
  mood text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.daily_focus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  objective text,
  objective_met boolean,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ============================================================
-- Realtime — without this, the app's cross-device live sync
-- (Supabase Realtime subscriptions in hooks/use-ledger-data.ts) will
-- silently receive nothing. Postgres changes are opt-in per table.
-- Wrapped in existence checks so this script is safe to re-run.
-- ============================================================
-- ============================================================
-- Trade detail expansion: reflection text, and up to 3 named
-- screenshots (before/after/markup) instead of a single screenshot.
-- The old screenshot_url column stays for any trade saved before this
-- change — new trades write into `screenshots` instead.
-- ============================================================
alter table public.trades add column if not exists reflection text;
alter table public.trades add column if not exists screenshots jsonb not null default '{}'::jsonb;

-- ============================================================
-- Priority 1 trade journal expansion: stop/target, account, duration,
-- execution score, before/after emotion, a named mistake, and tags.
-- The `during` screenshot slot lives inside the existing `screenshots`
-- jsonb column — no schema change needed for that one.
-- ============================================================
alter table public.trades add column if not exists stop numeric;
alter table public.trades add column if not exists target numeric;
alter table public.trades add column if not exists account text;
alter table public.trades add column if not exists duration_minutes integer;
alter table public.trades add column if not exists execution_score smallint;
alter table public.trades add column if not exists emotion_before text;
alter table public.trades add column if not exists emotion_after text;
alter table public.trades add column if not exists mistake text;
alter table public.trades add column if not exists tags jsonb not null default '[]'::jsonb;

-- ============================================================
-- Habits — daily habit tracking (Sleep, Gym, Water, Reading,
-- Meditation, Journaling, Content Creation, Steps, or whatever the
-- user defines). One row per habit, one log row per habit per day.
-- ============================================================
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists habits_user_idx on public.habits (user_id, sort_order);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, date desc);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trades'
  ) then
    alter publication supabase_realtime add table public.trades;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions'
  ) then
    alter publication supabase_realtime add table public.sessions;
  end if;
end $$;
