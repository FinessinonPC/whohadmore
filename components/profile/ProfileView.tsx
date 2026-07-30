"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { GameStats } from "@/components/profile/GameStats";
import { DangerZone } from "@/components/profile/DangerZone";
import { SignUpFlow } from "@/components/auth/SignUpFlow";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { ACHIEVEMENTS, effectiveStreak, levelInfo, rankTitle } from "@/lib/leaderboard";
import { previousISODate, todayISO } from "@/lib/date";

/**
 * The player's own profile. ONE currency: the points you score are the points
 * that level you up, so the ring, the bar and the leaderboard all read from
 * total_score. Streaks live here as a habit badge - they're something you hold,
 * not a multiplier on what you score.
 */
export function ProfileView() {
  const { profile, rank, claim, reload, loading, deleteAccount } = useProfile();

  const points = profile?.total_score ?? 0;
  const { level, into, needed } = levelInfo(points);
  const toNext = Math.max(0, needed - into);
  const today = todayISO();
  const streak = effectiveStreak(
    profile?.current_streak ?? 0,
    profile?.last_played_date ?? null,
    today,
    previousISODate(today)
  );
  const hasName = Boolean(profile?.username);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-5 sm:max-w-2xl">

      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-ink">Profile</h1>
      <p className="mt-1 text-[15px] text-ink-secondary">Your level, streak, and lifetime stats across every game.</p>

      <section className="mt-6 card-ink rounded-2xl p-6">
        {hasName ? (
          <>
            <div className="flex items-center gap-4">
              <LevelRing level={level} progress={needed > 0 ? into / needed : 0} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-2xl font-extrabold leading-tight text-ink">
                  {profile?.username}
                </p>
                <p className="text-sm font-bold text-correct">{rankTitle(level)}</p>
              </div>
              <div className="text-right">
                <p className="small-caps text-[10px] text-ink-secondary">Rank</p>
                <p className="text-2xl font-extrabold text-ink">{rank ? `#${rank}` : "-"}</p>
              </div>
            </div>

            {/* The one number. Points score your day, rank you on the board, AND
                fill this bar - there's nothing else to keep track of. */}
            <div className="mt-5">
              <div className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-ink-secondary">
                <span>
                  <span className="tabular text-ink">{into.toLocaleString()}</span> / {needed.toLocaleString()} pts
                </span>
                <span>Level {level + 1}</span>
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-ink bg-background">
                <motion.div
                  className="h-full bg-[#FFB300]"
                  initial={{ width: 0 }}
                  animate={{ width: `${needed > 0 ? (into / needed) * 100 : 0}%` }}
                  transition={{ type: "spring", damping: 24, stiffness: 180 }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-ink-secondary">
                {toNext.toLocaleString()} more points to Level {level + 1} - about{" "}
                {gamesToGo(toNext)}.
              </p>
            </div>

            {/* Career total, front and centre - it's the level track now. */}
            <div className="card-ink-flat mt-5 flex items-stretch divide-x divide-border">
              <div className="flex-1 px-3 py-2.5 text-center">
                <p className="tabular font-condensed text-3xl font-semibold leading-none text-ink">
                  {points.toLocaleString()}
                </p>
                <p className="small-caps mt-1 text-[9px] text-ink-secondary">Career points</p>
              </div>
              <div className="flex-1 px-3 py-2.5 text-center">
                <p className="tabular font-condensed text-3xl font-semibold leading-none text-ink">
                  {(profile?.monthly_score ?? 0).toLocaleString()}
                </p>
                <p className="small-caps mt-1 text-[9px] text-ink-secondary">This month</p>
              </div>
            </div>

            {/* Habit stats. The streak is a badge you hold, not a bonus you
                score - so it's labelled as one, with no multiplier attached. */}
            <div className="mt-5 grid grid-cols-3 divide-x divide-border">
              <StatCell
                value={streak}
                label="Streak"
                accent="#FF7A00"
                note={streak > 0 ? `day${streak === 1 ? "" : "s"} in a row` : "play today"}
              />
              <StatCell value={profile?.longest_streak ?? 0} label="Highest streak" />
              <StatCell value={profile?.days_played ?? 0} label="Days" />
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-secondary">
              Streaks earn badges, not points - the board ranks how you play, not how often.
            </p>

            {/* The theme toggle lives here as well as the desktop nav - on a
                phone the nav slot went to Past cards and Board, which people
                press daily, rather than a switch most flip once. */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <UsernameEditor current={profile?.username ?? ""} onSave={claim} />
              <span className="sm:hidden">
                <ThemeToggle />
              </span>
            </div>
          </>
        ) : loading ? (
          <ProfileSkeleton />
        ) : (
          <SignUpFlow onDone={reload} />
        )}
      </section>

      {hasName && (
        <>
          <GameStats />
          <Achievements earned={profile?.achievements ?? []} />
          <DangerZone username={profile?.username ?? ""} onDelete={deleteAccount} />
        </>
      )}
    </main>
    </>
  );
}

// A decent game lands around 600 points, so that's the yardstick for turning
// "1,850 points to go" into something a player can picture.
const POINTS_PER_GAME = 600;

function gamesToGo(points: number): string {
  const n = Math.max(1, Math.round(points / POINTS_PER_GAME));
  return `${n} more game${n === 1 ? "" : "s"}`;
}

function Achievements({ earned }: { earned: string[] }) {
  const earnedSet = new Set(earned);
  return (
    <section className="mt-4 mb-2 card-ink rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-extrabold text-ink">Achievements</h2>
        <span className="text-xs font-semibold text-ink-secondary">
          {earnedSet.size} / {ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const got = earnedSet.has(a.id);
          return (
            <div
              key={a.id}
              className={`wonky group relative flex cursor-help flex-col items-center gap-1.5 border p-2.5 text-center transition-colors ${
                got ? "border-ink bg-[#FFB300]/15" : "border-border bg-background"
              }`}
            >
              <span className={`text-2xl leading-none ${got ? "" : "opacity-30 grayscale"}`}>{a.icon}</span>
              <span className={`text-[9px] font-bold leading-tight ${got ? "text-ink" : "text-ink-secondary"}`}>
                {a.label}
              </span>

              {/* Hover tooltip - what it is and how to earn it */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-40 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-left opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                <p className="text-[11px] font-bold text-background">{a.label}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-background/80">{a.description}</p>
                <p
                  className={`mt-1 text-[9px] font-bold uppercase tracking-wide ${
                    got ? "text-correct" : "text-background/50"
                  }`}
                >
                  {got ? "Unlocked" : "Locked"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-[72px] w-[72px] shrink-0 rounded-full bg-background" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 rounded bg-background" />
          <div className="h-4 w-24 rounded bg-background" />
        </div>
      </div>
      <div className="mt-5 h-3.5 w-full rounded-full bg-background" />
      <div className="mt-6 h-20 w-full rounded-2xl bg-background" />
    </div>
  );
}

function StatCell({
  value,
  label,
  accent,
  note,
}: {
  value: number;
  label: string;
  accent?: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col items-center px-1">
      <span
        className={`tabular text-2xl font-extrabold leading-none ${accent ? "" : "text-ink"}`}
        style={accent ? { color: accent } : undefined}
      >
        {value.toLocaleString()}
      </span>
      <span className="mt-1.5 small-caps text-[9px] text-ink-secondary">{label}</span>
      {note && <span className="text-[9px] font-bold text-ink-secondary">{note}</span>}
    </div>
  );
}

function LevelRing({ level, progress }: { level: number; progress: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" className="stroke-border" strokeWidth="7" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="#FFB300"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", damping: 24, stiffness: 160 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="small-caps text-[8px] leading-none text-ink-secondary">Lvl</span>
        <span className="text-2xl font-extrabold leading-none text-ink">{level}</span>
      </div>
    </div>
  );
}

function UsernameEditor({
  current,
  onSave,
}: {
  current: string;
  onSave: (u: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [err, setErr] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs font-semibold text-ink-secondary underline underline-offset-2 hover:text-ink"
      >
        Change username
      </button>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={20}
        className="h-10 w-36 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ink"
      />
      <Button
        size="sm"
        onClick={async () => {
          const r = await onSave(value.trim());
          if (r.ok) setEditing(false);
          else setErr(r.error ?? "Failed");
        }}
      >
        Save
      </Button>
      {err && <span className="text-[10px] text-wrong">{err}</span>}
    </div>
  );
}
