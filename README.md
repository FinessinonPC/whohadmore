# WhoHadMore

A daily higher/lower game. Two cards, one stat — tap the one with the bigger
number. One new game ships every day, with a fully-playable archive of every
past game. Clean, minimal, premium — NYT Games meets Robinhood.

Built with **Next.js (App Router)**, **Supabase** (Postgres + RLS),
**Tailwind CSS**, **Framer Motion**, and the **Wikimedia REST API** for images.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your values (optional for a first run)
npm run dev                  # http://localhost:3000
```

Out of the box (no env), the app serves a **mock game** so `/play` and
`/archive` are instantly playable. Wire up Supabase to serve real games and to
use the admin panel.

## Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | public anon key (reads published games) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | admin writes; **never** expose to the client |
| `ADMIN_PASSWORD` | server only | gates `/admin` (build-time only, not real auth) |

## Database setup

Run the migration in your Supabase project (SQL editor or CLI):

```
supabase/migrations/0001_initial_schema.sql
```

It creates `daily_games`, `game_cards`, `game_results`, and the scaffold tables
(`users`, `leaderboard_entries`), and enables Row Level Security:

- `daily_games` / `game_cards` — publicly readable **only** when `published = true`
- `game_results` — anyone can insert (anonymous session), publicly readable
- `users` / `leaderboard_entries` — scaffold for future auth + leaderboards
- All admin writes go through the **service role**, which bypasses RLS.

---

## How it works

### Playing
- `/` redirects to `/play` (today's game, anchored to US Eastern).
- `/play/[date]` plays any archived day — same component, an archive banner is
  the only difference.
- Game state lives in [`hooks/useGame.ts`](hooks/useGame.ts): 15-card chain,
  3 lives, score, and a phase machine
  (`idle → reveal-correct/wrong → transitioning → complete`).
- A wrong guess costs a life and lets you retry the same pair; ties count as
  correct. On completion the result is saved to `game_results` keyed by an
  anonymous `session_id` (localStorage) — swapped for `user_id` when auth lands.

### The count-up
The number reveal ([`components/game/CountUp.tsx`](components/game/CountUp.tsx))
animates 0 → value on an ease-out-expo curve — fast off the line, settling into
the final figure. It's the hero beat of every reveal.

### Admin
- `/admin` — month calendar; green dot = published, amber = draft.
  Double-click a day to edit it.
- `/admin/[date]` — plan a day: topic/stat fields, a 15-row reorderable card
  list (drag handles), live deck preview, and **Save / Publish**.
- Type an entity name → on blur it auto-fetches a Wikipedia image. The
  **Image** button opens a picker for manual URLs or a custom Wikimedia search.
- **Generate with AI** opens a drawer with a ready-to-copy prompt; paste the
  model's JSON back and it populates all 15 cards and fetches every image at
  once.
- Gated by `ADMIN_PASSWORD` (stored in `sessionStorage`). If unset, admin is
  open for local development.

### Wikimedia
The browser never calls Wikipedia directly. Image lookups go through
`/api/wikimedia` → [`lib/wikimedia.ts`](lib/wikimedia.ts), which hits the REST
summary endpoint and returns `thumbnail.source` (or `null`, which falls back to
entity initials).

---

## Project layout

```
app/            routes (play, archive, admin) + API route handlers
components/     game/, admin/, ui/, archive/ — all hand-built, Tailwind only
hooks/          useGame, useDailyGame, useStreak (stub)
lib/            supabase, wikimedia, gameLogic, seed, date, admin helpers
types/          shared DB + API types
supabase/       SQL migration
```

## Roadmap (scaffolded, not yet built)

- **Auth** — `users` table + swap `session_id` → `user_id` in result saves.
- **Leaderboards** — `leaderboard_entries` table, `/leaderboard/[date]`, and the
  `LeaderboardSheet` stub.
- **Streaks** — consecutive `play_date`s via the `useStreak` stub.
