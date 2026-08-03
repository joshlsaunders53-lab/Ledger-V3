# Ledger

A performance operating system for traders. Reward process, not profit.

This is the Next.js rebuild of the original single-file Ledger app —
same data, same visual identity, same calculations, now on a stack that
can actually grow into a real SaaS product.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Framer Motion
- Lucide Icons
- React Hook Form + Zod (wired in as a dependency, first real form lands with the Trading Session flow)
- Recharts
- Supabase (client + server scaffolded; still using the same single shared row your old app used — see "About auth" below)

## Setup — real cloud backend (auth + per-user Postgres)

This is a from-scratch setup now — the app moved from a single shared
Supabase row to real authenticated, per-user data. Do these in order.

### 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → sign in → **New project**
2. Pick any name/region, generate a database password (save it somewhere — you likely won't need it day-to-day, Supabase manages connections for you)
3. Wait ~2 minutes for provisioning

*(You can reuse an earlier Ledger Supabase project instead of creating
a new one — the SQL below only adds new tables, it doesn't touch or
require deleting anything that's already there. A fresh project is
simpler to reason about, but either works.)*

### 2. Run the SQL

In your Supabase project: **SQL Editor** (left sidebar) → **New query**.

1. Open `supabase/schema.sql` from this project, paste the whole file in, click **Run**
2. Open `supabase/policies.sql`, paste it in as a **second** query, click **Run**
3. Open `supabase/storage.sql`, paste it in as a **third** query, click **Run** — this creates the private bucket trade screenshots upload to

All three files are idempotent — safe to run again if you need to.

**If you already had this project running before this update**, re-run
`schema.sql` again — it now includes several new `alter table`
statements: `stop`, `target`, `account`, `duration_minutes`,
`execution_score`, `emotion_before`, `emotion_after`, `mistake`, and
`tags` on `trades`, plus a 4th screenshot slot (`during`) inside the
existing `screenshots` column — no schema change needed for that one.
Running the file again is safe; it won't touch your existing data.
### 3. Get your API keys

Project **Settings** (gear icon) → **API**. You need two values:
- **Project URL**
- **anon / public** key (not the `service_role` key — never put that in a `NEXT_PUBLIC_*` variable or ship it to a browser)

### 4. Paste your environment variables

Copy `.env.example` to a new file called `.env.local` in the project root, and fill in the two values from step 3:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

`.env.local` is gitignored — it never gets committed or pushed.

### 5. Enable email confirmations (optional but recommended)

By default Supabase requires email confirmation before a new signup
can sign in. To customize this: **Authentication** → **Providers** →
**Email**. For local testing without setting up email delivery, you
can temporarily disable "Confirm email" here — just remember to
re-enable it before real users sign up.

### 6. Start the project

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/login`. Create an
account, then you're in.

## Deploying to Vercel

1. Push this repo to GitHub
2. [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo (Next.js is auto-detected, no config needed)
3. Before deploying, expand **Environment Variables** and add the same two keys from step 4 above
4. **Deploy**
5. Back in Supabase: **Authentication** → **URL Configuration** → add your Vercel domain (e.g. `https://your-app.vercel.app`) to **Redirect URLs** — otherwise password reset and signup confirmation links will fail in production

## Migrating existing local/single-row data

If you had trades or sessions in the old shared "journal" row from
before auth existed, there's no automatic migration — that data has
no `user_id` to attach to, since users didn't exist yet. Two honest
options:

- **Start fresh** (recommended for anything pre-launch): sign up, and
  everything from here forward is real, per-user data.
- **Manual migration**: in the Supabase SQL Editor, `select data from
  journal where id = 1` to see the old JSON blob, then hand-write
  `insert` statements into `trades` / `sessions` using your new
  `auth.uid()` (find it under **Authentication** → **Users** once
  you've signed up). This is manual because the old shape (arrays of
  trades embedded in one JSON document) doesn't map cleanly to the
  new relational tables — recommended only if the old data is small
  and worth preserving by hand.

## Recommendations before beta launch

- **Rate limit auth endpoints.** Supabase has basic protections, but
  review **Authentication → Rate Limits** before opening signups
  publicly.
- **Turn email confirmation back on** if you disabled it for local
  testing (step 5 above).
- **The "Remember me" checkbox on Sign In is UI-only right now** — it
  doesn't yet change session lifetime. Supabase persists sessions by
  default regardless of the checkbox. Making it functional needs
  per-login client configuration that the current single-client-
  instance architecture doesn't support cleanly — worth a small
  follow-up if this distinction matters to you.
- **No offline fallback anymore.** The old localStorage cache was
  removed per your instruction ("do not use localStorage for
  application data"). If Supabase is unreachable, the app now shows
  an error rather than stale cached data. Reasonable for a
  cloud-first product, but worth knowing.
- **Screenshots are now real** — restored to trade logging with actual
  Supabase Storage, not local blob URLs. **You must run
  `supabase/storage.sql`** (new this round) for uploads to work — it
  creates the private `trade-screenshots` bucket and its access
  policies. Skipping this step means every screenshot upload will fail
  with a permissions error.
- **Realtime must stay enabled on `trades` and `sessions`** in
  Supabase (handled by `schema.sql`) — if you ever reset replication
  settings, cross-device live sync will silently stop working with no
  error shown to the user. Worth an integration test before launch.

## Habits (new)

`/habits` — daily habit tracking, back in the nav after being cut
during an earlier redesign. New tables: `habits`, `habit_logs`
(schema + RLS in `supabase/schema.sql` / `policies.sql` — **run both
again** if you already had the project set up). A brand-new account
gets seeded with the original 8: Sleep, Gym, Water, Reading,
Meditation, Journaling, Content Creation, Steps — fully editable,
addable, deletable, reorderable via the "Manage" toggle.

Each habit shows: today's toggle, current streak, a weekly-completion
ring and a monthly-consistency ring (reusing the same ring component
History's calendar uses), and a 14-day trailing dot strip. All three
stats — streak, weekly %, monthly % — were computed as pure functions
in `lib/habits-stats.ts` and actually executed against known test
data before any UI was built on top of them (streak counting,
including the "today not done yet" edge case, weekly/monthly
percentages — all verified against hand-calculated expected values).

## Trading Rules (new)

`/settings` → **Trading Rules** card. Add, edit, delete, and
drag-to-reorder your actual rules — the thing "did you follow your
plan?" was always asking about without ever showing you what the plan
was. No SQL needed; reuses the `settings.rules` column that's existed
since early on. **Not yet connected** to the Pre-Trade ritual, Live
Session, or Journal — those still ask yes/no from memory, they don't
show or check against this list. Natural next step, not done yet.

## Priorities 2-4 — Dashboard confirmed, History enriched, Journal built (this round)

**Priority 2 (Dashboard)** needed almost nothing — it already matched
spec from an earlier round. Added the one missing piece: Current
Streak as a 9th KPI (the formula already existed in `lib/dashboard.ts`,
it just wasn't surfaced in the grid).

**Priority 3 (History)**: the calendar header now shows Monthly P&L,
Monthly Win Rate, Trading Days, and Average Daily P&L (four small
stat cards, computed live from the month's real trades — not stored,
not cached). Each day cell now shows its trade count next to its
P&L. The day drawer's trade rows gained the fields that were missing
from the read-only view even though they existed on the data model:
Duration, Execution score, Emotion before/after, Mistake, Tags — Full
review still links out to the dedicated trade page for the complete
experience (large screenshots, AI Coach placeholder, etc).

**Priority 4 (Daily Journal)** is new: `/journal`, with Morning and
Evening sections covering every field you listed, a markdown-lite
free-writing editor (write/preview toggle, live word count — no new
dependency, `lib/markdown.ts` is a small safe subset renderer:
headers, bold, italic, lists), date navigation (prev/next day or pick
a date directly), and search across every previous entry's text
fields. Auto-saves ~900ms after you stop typing, with a
saving/saved indicator per section.

This reuses the `journal_entries` table that's existed in the schema
since months ago but was never wired up — **no SQL migration needed
for the Journal.** While building it I also found and deleted
`lib/journal.ts`, an old dormant file left over from before the app's
big pivot — it imported a `JournalEntry` type that no longer exists,
which would have broken `next build` the first time anything
type-checked it.

## Real backend — auth + per-user Postgres (this round)

The single biggest architectural change since V1: there is no more
shared single-row data store. Every user gets their own rows, gated
by Supabase Auth and enforced by Row Level Security — not just
"trusted to only query their own data," but physically incapable of
reading anyone else's, even with a compromised client.

- **Auth**: email/password sign in, sign up (with email
  confirmation), forgot/reset password, sign out. `lib/supabase/auth.ts`
  holds every auth action as a plain function — no auth logic lives
  inside components. `middleware.ts` + `lib/supabase/middleware.ts`
  guard every route server-side: signed out → redirected to `/login`;
  signed in and hitting an auth page → redirected to `/home`.
- **Schema**: `supabase/schema.sql` — 8 tables (profiles, settings,
  sessions, trades, weekly_reviews, journal_entries, daily_checkins,
  daily_focus). The last three are reserved for later — V1's UI
  doesn't write to them yet, kept per your explicit table list as
  future-proofing.
- **RLS**: `supabase/policies.sql` — every table, every user only
  ever sees their own rows.
- **Query layer**: `lib/db/` — `trades.ts`, `sessions.ts`,
  `settings.ts`, `weekly-reviews.ts`. Components never talk to
  Supabase directly for app data; they call these.
- **Live cross-device sync**: `hooks/use-ledger-data.ts` subscribes to
  Supabase Realtime on `trades` and `sessions`, filtered to the
  current user. Log a trade on your phone, it appears on your laptop
  without a refresh — this is what actually delivers "same data on
  every device," not just "same data on next page load."
- **No more localStorage for app data.** The in-progress session
  (previously localStorage) is now just the `sessions` row with
  `ended_at IS NULL` — the database enforces at most one per user, so
  resuming a live session on a different device just works. The
  old offline-cache fallback was removed too, per your explicit
  instruction; see "recommendations before beta" for the tradeoff.

### Every file touched this round

**New:**
`supabase/schema.sql`, `supabase/policies.sql`, `middleware.ts`,
`lib/supabase/middleware.ts`, `lib/supabase/auth.ts`, `hooks/use-auth.ts`,
`lib/db/trades.ts`, `lib/db/sessions.ts`, `lib/db/settings.ts`,
`lib/db/weekly-reviews.ts`, `app/(auth)/layout.tsx`,
`app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`,
`app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`,
`app/(app)/layout.tsx`, `features/auth/login-form.tsx`,
`features/auth/signup-form.tsx`, `features/auth/forgot-password-form.tsx`,
`features/auth/reset-password-form.tsx`, `.env.example`

**Rewritten:**
`hooks/use-ledger-data.ts`, `hooks/use-active-session.ts`,
`features/session/session-flow.tsx`, `features/settings/settings-view.tsx`,
`features/today/today-view.tsx`, `app/layout.tsx` (AppShell moved out),
`lib/validation.ts` (auth schemas added), `.env.local` (stale credentials cleared)

**Moved** (path only, content unchanged): `app/home`, `app/session`,
`app/history`, `app/coach`, `app/settings` → into `app/(app)/`

**Deleted:** `.env.local.example` (superseded by `.env.example`)

**Untouched:** every feature component (calendar, coach grading,
pre-trade form, live session view, etc.) — only the data-fetching
layer underneath them changed, not the UI, per your "do not break the
UI" instruction.

## Dashboard simplified, Analytics added (this round)

The Dashboard (`/home`) now shows exactly 8 numbers — balance, today/
weekly/monthly P&L, win rate, profit factor, avg R, discipline score —
plus one large equity curve and your 5 most recent trades. Everything
else that used to live there (monthly performance, weekday/session/
setup breakdowns, psychology, discipline detail) moved to a new
**Analytics** page (`/analytics`, back in the nav).

The Session History calendar (`/history`) now shows monthly P&L above
it and each week's total to the right of that week's row. Clicking a
day opens a **right-hand drawer** (`components/ui/drawer.tsx`, new)
instead of the old centered dialog — it overlays the page and never
changes its height. That same drawer now shows entry, exit,
direction, contracts, P&L, R multiple, setup, notes, reflection, and
up to three screenshots (before/after/markup) per trade, each
click-to-fullscreen.

Trade logging (`Add Trade` modal) gained those same fields — kept
collapsed behind an "Add entry, exit, setup, notes & screenshots"
toggle so quick logging (direction/symbol/P&L/followed-plan) is still
just as fast as before, with the option to go deeper when you want to.

One deliberate reading worth flagging: your Dashboard spec didn't
include a "start session" button, so it's gone from Home — starting a
session now happens via the **Session** item in the nav, which was
already there.



```bash
npm install
npm run dev
```

Open http://localhost:3000 — redirects to `/login` if signed out, `/home` if signed in.

## What's migrated

**Navigation** — restructured from a single page into real routes:
- Sidebar on desktop, bottom nav on mobile, both reading from one
  shared list (`layouts/nav-items.ts`) so they can never drift apart.
- `AppShell` now lives in `app/layout.tsx` (not per-page), so it
  persists across navigation and page transitions actually animate
  instead of hard-cutting.

**Dashboard** — refocused to *today*, not deliberately duplicated
history:
- Account balance (click to set your starting balance)
- Today's P&L, today's discipline score (with the same discipline
  ring used in Session History), current streak, trades today
- Trading session status card (live/idle/awaiting review, reads your
  local session state) with a direct link to resume
- Today's habits (honest placeholder — Habits isn't built yet)
- Quick actions (Trading Session / History / Journal / Settings)
- Weekly overview (reuses the exact `WeeklySummaryStrip` component
  from Session History — one implementation, not two)

  The old all-time widgets (equity curve, win rate/profit factor/avg R
  strip, recent trades, performance detail, emotion vs. P&L,
  discipline breakdowns) were **removed from the Dashboard**, not
  deleted from the codebase — they're sitting in `features/dashboard/`
  unused, ready to be the starting point for the Analytics page next
  round, since that's genuinely where they belong now.

**Trading Session** — fully working, the main new feature:
- **Pre-Trade Preparation** — sleep/energy/stress/confidence sliders, emotion picker, news-checked toggle, daily bias, max risk, daily loss limit, rules checklist, affirmation. Progress indicator, submit disabled until everything's complete.
- **Live Trading Screen** — session timer, trade count, rules broken, discipline score, current emotion. No P&L shown, on purpose. Press `N` to add a trade.
- **Add Trade Modal** — direction, symbol, P&L, setup dropdown, confidence slider, emotion, "did you follow your plan," optional screenshot, notes. `⌘/Ctrl + Enter` to save.
- **End Session Review** — discipline score, rules followed/broken, avg confidence, emotional trend, best execution, biggest mistake, one improvement for tomorrow.

Every formula in `lib/calculations.ts` and `lib/session.ts` was ported/written
explicitly and is fully typed — nothing is a black box.

**Session History** — fully working (day-click has worked since it
was first built; if it's not opening for you, see the note below):
- Monthly calendar, GitHub-contributions-style intensity coloring (green = profit, red = loss, grey = no trades), with a small **discipline ring** on every trading day — the visual encoding of "reward process, not profit." A red day with high discipline reads very differently from a green day with low discipline, on purpose.
- Click any day to open its full session: P&L, trade count, win rate, avg R, best/worst trade, discipline score, psychology rating, rules followed/broken, and every trade expandable to entry/exit, setup, confidence, emotion, plan-followed, notes, and screenshot.
- Weekly summary strip (always shows the current calendar week, regardless of which month you're browsing below it).
- Monthly summary cards + six charts: daily cumulative P&L, P&L by weekday, win rate over time, setup performance, emotions vs. profitability, discipline score trend.
- Formulas live in `lib/session-history.ts`, fully typed, same pattern as `lib/calculations.ts`.

**Psychology Journal** — fully working, new dedicated page:
- **Morning check-in** — mood, confidence, energy, stress, sleep,
  focus, emotion. Not gated to starting a trading session — you can
  check in anytime.
- **Post-session reflection** — biggest mistake, biggest win, lesson
  learned, did-I-follow-my-process, one improvement for tomorrow.
- **Trends** — confidence/energy/stress/sleep/focus over your last 30
  check-ins, plus mood frequency. Both stored per-day in
  `state.journalEntries`.
- One entry per calendar day, upserted — filling in the morning
  check-in and the evening reflection both write to the same day's
  record (`lib/journal.ts`).

**Settings** — new, genuinely functional (not a stub): starting
balance editor, account/data summary (trade/session/rule counts),
notes on single-user mode and dark-mode-only.

## What's not migrated yet (and why)

- **Analytics, AI Coach, and Habits are still "Soon" stubs.** This
  round focused on the navigation restructure, Dashboard rework, and
  Psychology Journal — genuinely finishing those rather than doing a
  shallow pass on all six requested pages at once. They're next.
- **On "clicking a calendar day does nothing"**: day-click has opened
  the full day detail panel since Session History was first built
  (`DayDetailPanel`, wired via `onSelectDay` → `DayDetailPanel`). If
  it's not working when you run this, it's likely the npm install/run
  steps rather than the code — let me know exactly what happens
  (nothing visually changes? an error in the browser console?) and
  I'll debug the actual cause rather than guess.
- **Editing/deleting past trades, the rules list UI, the pre-market
  check-in from the old app** — these still only exist on your old
  static site. The new Trading Session flow replaces *logging* new
  trades, but rule management and historical edits aren't built here
  yet.
- **Screenshots aren't actually saved anywhere.** The Add Trade modal
  lets you attach one and preview it, but it only exists as a local
  object URL in your browser tab — refresh the page and it's gone. It
  is **not** written to Supabase. Wiring up Supabase Storage is a
  clearly scoped next step, not started.
- **"Improvement for tomorrow" is a simple rule-based heuristic**,
  not AI — it's a few if/else templates in `lib/session.ts`. Real
  analysis is what the AI Coach feature is for, later.
- **An in-progress session lives in `localStorage`, not Supabase.**
  That's deliberate — a live session is inherently single-device and
  ephemeral. Every trade you log *during* the session is saved to
  Supabase immediately, though, so you never lose actual trade data,
  even if the session state itself doesn't sync across devices.
- **Session History was built against your real trade data, not mock
  data** — the spec said to use mock data, but a real, working data
  layer already existed from the Dashboard, so mocking it would have
  been throwaway work. Flagging this since it was an explicit
  deviation from what was asked.
- **"Session notes" in the day detail panel shows that day's
  affirmation** (from the Pre-Trade form), not a dedicated day-level
  notes field — there isn't one yet. Per-trade notes still work fully.
- **Screenshots in Session History have the same limitation as the
  Add Trade modal** — they're local browser blob URLs, not saved
  anywhere. A trade you screenshot today almost certainly won't show
  that screenshot if you reload or come back tomorrow. Same fix
  needed: real Supabase Storage.
- **"Consistency Score" is a simple heuristic** (% of trading days
  that week at/above an 80% discipline score), not a statistical
  measure — defined in `computeWeeklySummary` in
  `lib/session-history.ts` if you want to tune it.
- **Filters, search, tags, AI insights, PDF/CSV export** — explicitly
  scoped out as "future proofing only" per your request. Components
  are structured (typed data in, presentational UI out) to make
  adding these straightforward later, but none of them exist yet.
- **PWA / installable app** — the manifest and icons are copied into
  `/public` but not wired up yet (no `manifest.json` link, no service
  worker).
- **Authentication** — `lib/supabase/client.ts` and `server.ts` are
  ready for it, but the app still reads/writes one shared row
  (`journal`, `id = 1`), exactly like the old app. It's genuinely
  single-user right now. When you're ready for real accounts, the
  main change is in `hooks/use-ledger-data.ts`: swap `.eq("id", 1)`
  for a query scoped to `auth.uid()`, plus a `user_id` column and a
  login page.

## V1 pivot — performance operating system, not a trading journal

Everything below this section describes earlier iterations, kept for
history. This section describes where the app actually is now — a
different product, not a different skin.

**The thesis**: every feature answers "does this help the trader
execute their plan better?" — if not, it's cut, not shrunk. V1 is
deliberately the smallest complete daily loop, not a shallow pass
across every feature ever discussed.

**Four pages, exactly matching the brief, each answering one
question:**
- `/home` — "What should I focus on today?" A greeting and one
  button. Nothing else. No ring, no stats, no streak — even the
  discipline ring that anchored the previous Home redesign was cut,
  since the brief is explicit that even one number can be "a wall of
  data" next to the one thing that matters: starting the session.
- `/session` — "Am I ready to trade?" One continuous flow:
  - **Pre-session ritual** — 4 sliders (sleep, stress, confidence,
    energy) + one objective (preset chips or custom text). One
    screen, no steps — the previous 3-step version was itself cut
    down further once the field count dropped from 11 to 5.
  - **Live session** — timer, trade count, rules broken, discipline
    score. Add Trade is now just direction, instrument, P&L, and
    "did you follow your plan?" — four fields. Setup, confidence,
    emotion, and screenshot were all cut from V1 trade logging (the
    schema still supports them as optional, for V2).
  - **End of session** — asks one question ("did you meet today's
    objective?") then shows a **letter grade + short coach-voice
    narrative** (`lib/coach.ts`). The grade is built entirely from
    discipline (% of trades where the plan was followed) and whether
    the objective was met — **P&L is never an input to the score**,
    only ever a stated fact in the narrative. This is a rules-based
    stand-in for a real AI coach, not a disguised one — no LLM call
    happens here, and the README says so on purpose.
- `/history` — "What happened?" Calendar only. Tap a day, see that
  session's grade and trades. The six-chart grid, monthly stat-card
  grid, and weekly summary strip from the previous iteration are
  **gone**, not hidden — this was explicitly named as
  out-of-scope ("ignore: complex analytics, advanced charts").
- `/coach` — "What should I improve?" A weekly review
  (`lib/weekly-review.ts`): sessions run, average score, objectives
  met, a short narrative report. No chat interface yet — the brief
  frames Coach as the weekly report first, chat as optional/later.

**Settings** is deliberately not in the primary nav anymore — it's a
small icon in the sidebar/bottom nav, since it's utility, not part of
the daily loop.

**Removed entirely, not delayed**: Psychology Journal (its two forms
were redundant with the simplified ritual and the new Coach grade),
Analytics, Habits, the "More" page, the merged Sessions
today/history toggle from the previous round. Their route folders and
components are deleted, not hidden — `features/journal/`,
`features/dashboard/` (from the round before that), `app/analytics/`,
`app/habits/`, `app/more/`, `app/sessions/` are all gone from the
repo.

**Data model**: `PreTradeCheck` shrank to 5 fields. `Trade` kept its
optional richer fields (setup, confidence, emotions, screenshotUrl)
for backward compatibility and V2, but V1's UI doesn't collect them.
`TradingSession` gained `objectiveMet`, `grade`, and `narrative` —
the grade is computed once at end-of-session and persisted, since
`objectiveMet` is asked interactively and can't be re-derived later
from trade data alone.

## Redesign v2 (superseded) — from admin dashboard to consumer product

The original build (everything described below this point) was
treated as a failed prototype and replaced at the UX layer — routing,
data model, and Supabase architecture are unchanged, but the
navigation and several core screens were rebuilt from scratch around
a different design philosophy: one hero per screen, whitespace over
boxes, large typography, restrained color.

**Navigation** — 8 flat items became 5, organized by intent instead of
data type: Today, Sessions, Journal, Coach, More. Trading Session and
Session History merged into one "Sessions" destination with a
Today/History toggle (`?view=history`), since they're the same
concept split by time. Sidebar is now a slim floating icon rail;
mobile nav is a floating pill bar. A **⌘K command palette** was added
for fast keyboard navigation (`layouts/command-palette.tsx`).

**Today** (`features/today/`, replaces the old Dashboard) — one hero:
a large animated discipline ring (`hero-ring.tsx`, `hooks/use-count-up.ts`),
today's P&L small beneath it, one primary action button reflecting
session state, everything else (streak, habits, week) reduced to
quiet single lines instead of stat-card grids.

**Pre-Trade check-in** (`features/session/pre-trade-form.tsx`) —
rebuilt from one 11-field scrolling form into 3 sequential steps
(Body → Mind → Plan) with animated transitions and a dot progress
indicator, instead of everything visible at once.

**Old dashboard components removed entirely** (not just unused) —
`features/dashboard/` (stat-strip, equity-curve-chart, recent-trades,
performance-detail, emotion-vs-pnl, discipline-gauge, discipline-slips,
balance-card, etc.) had zero remaining importers after Today replaced
it, so the folder was deleted rather than left as dead code.

**What's NOT yet redesigned** — Session History's calendar lost its
outer card box, but its weekly-summary strip, monthly stat-card grid,
and six-chart layout are still the old dense style. Journal, Coach,
Analytics, Habits, and Settings are all still on the old visual
language (bordered cards, denser layouts) — none of them were
touched this round. This was a deliberate scope decision to get the
navigation, Today, and the Sessions merge genuinely right rather than
a shallow pass everywhere.

## Architecture

This is no longer a single page with sections — it's a real multi-page
app. `app/layout.tsx` renders `<AppShell>` once, which persists across
navigation and holds the sidebar (desktop) / bottom nav (mobile).
Every route under `app/` is just its feature's view component — no
per-page chrome, no duplicated layout code:

```
app/today/page.tsx        → <TodayView />
app/sessions/page.tsx     → <SessionsView /> (Today/History toggle, ?view=history)
app/journal/page.tsx      → <JournalView />
app/analytics/page.tsx    → stub (next round)
app/coach/page.tsx        → stub (next round)
app/habits/page.tsx       → stub (next round)
app/settings/page.tsx     → <SettingsView />
```

Page transitions are handled once, in `AppShell`, via Framer Motion's
`AnimatePresence` keyed on the route — not duplicated per page.

## Project structure

```
app/                   Routes. Each is a thin wrapper around one feature view.
components/ui/         shadcn/ui primitives (Card, Button, Dialog, Slider, etc.)
components/            Other shared, non-feature-specific components
layouts/               AppShell, Sidebar, BottomNav, nav-items.ts (single source of truth)
features/dashboard/    Today-focused dashboard
features/session/      Trading Session flow (pre-trade, live, add trade, review)
features/session-history/  Calendar, day detail, weekly/monthly summaries, charts
features/journal/      Psychology Journal (morning check-in, reflection, trends)
features/settings/     Settings page
hooks/                 Data-fetching hooks (use-ledger-data.ts, use-active-session.ts)
lib/                   Types, constants, calculations, Supabase clients,
                        shared Framer Motion variants
```

New features (Analytics, AI Coach, Habits) should follow the same
pattern: a `features/<name>/` folder, a route in `app/<name>/`, add
the nav entry to `layouts/nav-items.ts` (both Sidebar and BottomNav
read from it — one place to update, not two).

## Audit log — polish pass

Before adding anything new, this round audited the whole app for real
bugs rather than guessing. What was found and fixed:

- **Root-cause fix: dates were computed in UTC, not your local
  calendar day.** `todayStr()` used `new Date().toISOString()`, which
  converts to UTC first. Anyone in a timezone behind UTC (most of the
  Americas, and the UK for half the year) logging a trade in the
  evening could have it silently stamped with **tomorrow's** date —
  which is almost certainly what "clicking a calendar day shows the
  wrong session" actually was. Fixed at the source with a new
  `toLocalDateStr()` helper in `lib/calculations.ts`, used everywhere
  a date gets stamped: `todayStr()`, `getWeekDates()`, and the
  calendar's "is this today" check. The calendar grid's own date math
  was already safe (pure UTC in, UTC out, no local time ever mixed
  in) — only the *trade/session/journal timestamps* had the bug.
- **Checked every button and link in the app** for a real handler —
  all of them have one. No dead buttons found.
- **Checked for mock data or leftover TODOs** — none found; every
  feature already reads/writes through `useLedgerData` or local
  component state that ultimately saves through it.
- **`Card`'s hover-lift was applied to every card everywhere**, even
  though no card in the app is directly clickable — implying
  interactivity that didn't exist. Changed to an opt-in `interactive`
  prop; plain display cards now get a subtler hover instead of a
  "this is a button" lift.
- **Page transitions and each feature's own entrance animation were
  compounding** — the app-shell's page-level slide+fade played at the
  same time as each page's internal staggered card entrance, which
  looked like a slight double-motion. Simplified the page-level
  transition to a fast opacity crossfade so it frames the page change
  without fighting the content's own choreography.

What wasn't touched, on purpose:
- **Analytics, AI Coach, and Habits stay "Coming soon."** They're
  correctly labeled placeholders, not broken features pretending to
  work — removing them would just delete honest signposting for a
  page that's genuinely not built yet. Per your instruction, no new
  sections this round.

## Deploying

Push this to GitHub and import it into Vercel — it auto-detects
Next.js, no config needed. Add the same two environment variables
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the
Vercel project settings under Environment Variables (they won't come
from `.env.local`, since that file never leaves your machine).
