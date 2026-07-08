# WhoHadMore - Product & Design Blueprint

The single source of truth for building out the multi-game daily hub.
Read this before adding or changing any game. The goal: a **lessgames.com-style
collection** - simple, addicting, one-screen daily games - with WhoHadMore's
own identity: **every game is powered by one daily topic and its numbers.**

---

## 1. The concept

- One **daily topic** (e.g. "NBA Scoring Leaders 2024-25"): a set of cards,
  each card = entity name + stat value + image. Published once per day in the
  admin. **This one dataset powers every game** - adding games must never add
  daily admin work.
- The homepage (`/`) is the **hub**: the topic, the game tiles, and one
  combined **Today's Total**. Each game is a different *verb* on the same
  numbers, so the collection has variety without losing the theme.
- Retention loop: finish any game → `NextGameCTA` pulls you into the next
  unplayed one → all done → leaderboard. Tomorrow it resets.

### The roster (registry: `lib/modes.ts`)

Two kinds of games share the hub:
- **Stat games** derive from the daily card set (zero extra content).
- **Pack games** run on bundled daily packs (`lib/contentPacks.ts`),
  rotated deterministically by date - zero daily admin, refreshed by shipping
  pack updates (or later, per-date DB overrides - see §7).

The roster copies formats people already play daily, per the owner's
direction. Duality IS this site's Connections-style game. Quads and Emoji
were cut on 2026-07-07 (code in git history).

| id | Name | Copies | Accent | Kind | One-liner |
|----|------|--------|--------|------|-----------|
| `chain` | Chain | The Higher Lower Game | `#00C853` green | stat | Classic higher-or-lower run; daily score = distance (850) + hearts on a clear (150), max 1000 |
| `duality` | Duality | NYT Connections (pairs twist) | `#06B6D4` cyan | pack | 8 definitions hide 4 pairs, difficulty-colored; 200/pair + up to 200 speed on a solve, -150/mistake, 3 tries, max 1000 |
| `word` | Word | Wordle | `#FFC400` yellow | pack | Daily 5-letter word, 6 tries; 1000..500 pts by guess count |
| `mini` | Mini | NYT Mini crossword | `#2E6BFF` blue | pack | 5x5 grid; auto-completes when all correct; 800 base + up to 200 speed, -100/Check (floor 300), reveal = 0 |

**Weekday themes (Chain)**: every weekday has a flavor, derived from the
date in `lib/weekly.ts` (Movie Monday, Trending Tuesday, World Wednesday,
Celebrity Thursday, Foodie Friday, Scoreboard Saturday, Surprise Sunday).
Shown on the hub chain tile + start screen; baked into the admin AI prompt.
No schema - rename freely in one file.

Naming scheme: **one strong word per game** (the lessgames "-less" suffix
equivalent). Taglines carry the SEO phrases ("higher-or-lower") - product
names stay short. Word accepts any 5-letter guess today; adding a dictionary
check is a known TODO.

---

## 2. Design system (do not drift)

Tokens live in `tailwind.config.ts` + `app/globals.css` (CSS vars flip for dark).

- **DARK-FIRST**: the flagship look is the dark theme (deep ink `#0B0D10`
  canvas, bright per-game accents). New visitors get dark; the toggle still
  offers light. Design every screen dark first, then check light.
- **Display type**: big headlines, game names, and score numerals are Oswald
  (`font-condensed font-semibold uppercase tracking-wide`) - the scoreboard
  voice. Body/UI text stays Inter. Never mix within one text block.
- **Primary actions**: `bg-cta text-background` (cta is the canvas inverse -
  white-on-dark in dark mode, dark-on-white in light). Never `text-white` on
  cta.
- **Neutrals**: `background`, `surface`, `border`, `ink`, `ink-secondary` -
  always via the tokens, never hex. Dark mode is automatic.
- **Semantic**: `correct` green / `wrong` red are for RESULTS ONLY. A game's
  accent is identity, not correctness - never use an accent to mean right/wrong.
- **Game accents**: exactly one per game, defined ONLY in `lib/modes.ts`.
  Components read `modeDef(id).accent`. Tints via hex-alpha suffix (`${accent}17`).
- **Type**: Inter (`font-sans`) everywhere; Oswald (`font-condensed`) only for
  big stat numbers on cards. Headings: `font-extrabold tracking-tight`.
  Numbers that change: always `.tabular`.
- **Shape**: cards/tiles `rounded-2xl`/`rounded-3xl`; chips/buttons pill
  (`rounded-full`) or `rounded-2xl` (Button component). Borders 1px `border`;
  2px only for selectable game cards.
- **Spacing rhythm**: tiles `p-4 sm:p-5`, gaps `gap-2.5`/`gap-3`, section
  spacing `mt-5`-`mt-7`. Game pages: `max-w-game` (540px), hub `sm:max-w-xl`.
- **Motion** (framer-motion): entrance = fade + 14-16px rise, staggered
  ~60-80ms; transitions 0.25-0.45s ease `[0.16,1,0.3,1]`. Feedback beats
  decoration - one orchestrated reveal is worth ten hover effects.
  `prefers-reduced-motion` is already respected globally.

### Icons (`components/ui/GameIcons.tsx`)
24px grid · filled geometric shapes only (no thin strokes) · rounded corners ·
**duotone**: accent at 100% + accent at ~35% for the secondary shape · must
read at 20px. Every game gets an icon here + `GameIconTile` renders the
accent-tinted square. New game = new icon following these exact rules.

---

## 3. Architecture contracts

### Adding a game (the recipe)
1. **Registry**: add to `MODES` in `lib/modes.ts` (id, name, verb, tagline,
   accent, maxPoints, `status: "live"`, href). Add its card-picker + scoring
   as pure functions in the same file (seeded, see below).
2. **Icon**: add to `GameIcons.tsx` per the icon rules.
3. **Component**: `components/games/<Name>Game.tsx` - client component,
   wrapped in `<GameShell mode="<id>" date={date}>`. End states render
   `<NextGameCTA date={date} current="<id>" />`.
4. **Route**: `app/<id>/[date]/page.tsx` - copy `app/rank/[date]/page.tsx`
   verbatim, swap component + metadata.
5. **Persistence**: `saveModeResult("<id>", date, {...})` on completion +
   POST `/api/modes/complete`. First play counts; replays never overwrite.
6. **Server**: add the id to `MODES` set in `app/api/modes/complete/route.ts`
   AND to the `mode` check constraint in a new SQL migration.
7. **Hub**: nothing - tiles render from the registry. Flip `status` to `live`.

### Rules that keep it fair & consistent
- **Seeding**: any random pick must be `mulberry32(hashSeed(\`${sessionId}:${date}:<id>\`))`
  so a reload never re-deals an easier hand. Never `Math.random()` for gameplay.
- **Ties**: filter cards to distinct `stat_value` before picking (see
  `pickRankCards`) - ordering/judging ties is unfair.
- **Score budget**: every game (Chain included) maxes at **1000 points** on the
  same scale, so no mode dominates the combined daily total. Duality and Mini
  fold in a speed bonus so scores vary rather than clumping on a few tiers. XP
  (leveling) is a separate currency from these daily points.
- **One-screen rule**: a game session is ≤60 seconds, no scrolling mid-play
  on a 390px phone. Intro copy is one sentence, on the board itself.
- **Already-played state**: score + "come back tomorrow" + NextGameCTA.
  Replays are view-only; never resubmit.

### Data & persistence
- Local: `lib/modeStore.ts` → key `whohadmore:<mode>:<date>` =
  `{score, maxScore, detail[], completedAt}`.
- Server: `game_mode_results` table (`supabase/migrations/0004_...sql`,
  **run in Supabase SQL editor before deploying any of this**). Unique on
  `(play_date, session_id, mode)`; API upserts with `ignoreDuplicates`.
- Daily leaderboard (`/api/leaderboard/daily`) folds `SUM(mode scores)` into
  each player's chain score and seats mode-only players. It degrades to
  chain-only if the table is missing - keep that resilience.

---

## 4. Hub spec (`components/hub/GameHub.tsx`)

Order: TopNav → (festive banner) → date + No. → topic H1 → card montage →
"One topic. N quick games. One total." → **Today's Total** card (sum + one
accent dot per live game) → tiles (live first, then `soon` tiles: dashed
border, 80% opacity, "Soon" chip, not clickable) → footer links.
The hub must render every tile purely from the registry - zero per-game code.

---

## 5. SPEC - Recall (`recall`, violet `#A44BFF`) - BUILD NEXT

**Fantasy**: "I just saw these numbers - can I keep them straight?"

**Flow** (single screen, 3 phases):
1. **Study** - `RECALL_CARDS` (4) cards face-up in a 2×2 grid, each showing
   entity image + name + its stat value. A 5-second ring counts down
   (`5s`; pause-free). Then values hide.
2. **Match** - the four values return as shuffled pills in a row under the
   grid (seeded shuffle; must not equal the original order). Tap a pill →
   it highlights (accent border) → tap a card to place it. Tap a placed pill
   to pick it back up. All four placed → "Lock it in".
3. **Reveal** - per card: correct → green ring + ✓; wrong → red ring, show
   the right value beneath. Score: `RECALL_POINTS_PER_MATCH` (250) per
   correct match, max 1000. Then score header + NextGameCTA.

**Picking**: `pickRecallCards(cards, seedKey)` = distinct-value seeded pick of
4, mirroring `pickRankCards` (add to `lib/modes.ts`, seed suffix `:recall`).
**Edge**: if fewer than 4 distinct-value cards exist, use 3 (min 2).
**Anti-cheese**: values formatted with `formatValue` so pills are compact.
Study phase timer starts on first render; no replay of study phase.

**Files**: `components/games/RecallGame.tsx`, `app/recall/[date]/page.tsx`,
registry flip to live, icon exists, API mode-set + SQL check constraint update.

---

## 6. SPEC - Split (`split`, orange `#FF7A00`) - BUILD AFTER RECALL

**Fantasy**: instant gut calls - the TikTok-speed game of the roster.

**Flow**: `SPLIT_ROUNDS` (5) rounds. Each round: one card (image + name) and a
big centered **line value** ("OVER or UNDER **26.5 PPG**?"). Two full-width
buttons: OVER (accent, up arrow) / UNDER (muted, down arrow). Instant reveal:
actual value stamps in, correct/wrong flash + haptic (`feedbackCorrect/Wrong`),
auto-advance after ~900ms. Progress dots like Pinpoint.

**Line construction** (pure function `splitLine(card, allCards, rng)`):
the line must be plausible, not trivial - take the card's actual value `v` and
offset it by ±(8-20%) of the day's value range, rounded to a "clean" number
(1-2 significant decimals via the existing formatting rules). The rng (seeded
`:split`) decides direction & magnitude, so half are genuinely over, half under.
**Never** place the line outside the day's min/max padded range.

**Scoring**: `SPLIT_POINTS_PER_ROUND` (200) per correct call, max 1000.
`detail[]` = per-round 200/0. Same persistence recipe as the others.

**Files**: `components/games/SplitGame.tsx`, `app/split/[date]/page.tsx`,
registry flip, API mode-set + SQL constraint update.

---

## 7. Content games - how they work & what's next

**Architecture**: every pack game resolves content server-side via
`lib/minigames.ts`: a `daily_minigames` row (play_date, mode, payload jsonb;
migration 0005) overrides the bundled pack for that date, else the pack
rotation serves (`lib/contentPacks.ts`, hashSeed(mode:date) % pack length).
Every date is therefore always playable, DB or not.

**Admin AI flow** (components/admin/MinigamesPanel.tsx): on /admin/<date>
each pack game shows Auto/Custom status with the same copy-prompt ->
paste-JSON flow as the chain game. Payloads are validated hard in
`lib/minigameSchemas.ts` (client AND server): Duality needs exactly 8 items
4/4; Word a single 5-letter answer; Mini is re-verified letter-by-letter
(grid shape, slot numbering, every crossing) so a hallucinated crossword can
never reach players. The admin calendar shows three dots per day
(cyan/yellow/blue - solid = custom, faint = auto pack).

**Content rules**: facts must be unambiguous and verifiable; every Duality
item belongs to exactly one side; every Impostor round has exactly one clean
impostor and a satisfying one-line connection. Fun beats difficulty; notes
(`note`, `connection`) are the "huh, neat" payoff.

**Next non-stat concepts (spec-approved shapes, build in this order):**
- **Faux** (real-or-fake, `#8BC34A`): six statements on one theme - real or
  made up? Two-button flow like Duality. Pack: `{theme, statements:
  [{text, real, note}]}`. 165/correct ≈ 1000.
- **Link** (common thread, violet-blue): four clues revealed one at a time -
  lock your guess early for more points, from 4 multiple-choice options.
  Pack: `{options[4], answerIndex, clues[4]}`. 250 max, -50 per extra clue.
- **Timeline** (before-or-after): "Did X happen before Y?" five snap calls.
  Pack: `{pairs: [{a, b, answer}]}`.
- **Blitz** (`#FF3B30`, lightning icon): 60-second endless higher-or-lower
  pulling random pairs from the WHOLE archive via a new `/api/blitz/pairs`
  route. Makes the archive a game. Score = streak; global daily best.
- **Duel**: challenge link = same seed as the challenger, head-to-head result
  screen. This is the viral share loop - pairs with the growth playbook.

---

## 8. Guardrails

- **SEO**: `/` keeps its title/description/canonical + `GameSeoFooter`. Never
  put stat values in crawlable HTML (site policy: no answer keys - the game
  data payload is fine). Keep "higher or lower" phrasing in taglines/copy.
- **No new admin burden**: if a game idea needs new daily content, it's wrong
  for this roster (or it goes through a spec pass first).
- **July 4th layer**: `GameShell` handles `isJuly4th` fireworks - new games
  get festive support for free by using the shell.
- **Score integrity**: server API clamps score to `maxPoints` per mode
  (update `MAX_SCORE` map when adding modes); first-play-counts everywhere.
- **A11y**: every interactive element keyboard-reachable; guesses/locks are
  real `<button>`s; `aria-label` on icon-only controls; respect the global
  reduced-motion rule.

## 9. Deploy checklist (when the user says go)

1. Run `supabase/migrations/0004_game_mode_results.sql` in Supabase.
2. Merge branch → `main` (Vercel deploys).
3. Smoke test: play all live games on prod, confirm hub total + daily
   leaderboard combines, `Unknown####` naming for anon mode-only players.
4. Request indexing on `/` in Search Console (title changed).
