"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TopNav } from "@/components/ui/TopNav";
import { getSessionId } from "@/lib/playStore";
import { GameStats } from "@/components/profile/GameStats";
import { SignUpFlow } from "@/components/auth/SignUpFlow";
import { useProfile } from "@/hooks/useProfile";
import { usePlayedResults } from "@/hooks/usePlayedResults";
import { ACHIEVEMENTS, levelInfo, rankTitle, streakMultiplier } from "@/lib/leaderboard";

/** The player's own profile: level, streak multiplier, and lifetime stats. */
export function ProfileView() {
  const { profile, rank, claim, reload, loading } = useProfile();

  const xp = profile?.xp ?? 0;
  const { level, into, needed } = levelInfo(xp);
  const streak = profile?.current_streak ?? 0;
  const hasName = Boolean(profile?.username);

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-5 sm:max-w-2xl">
      <TopNav />

      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-ink">Profile</h1>
      <p className="mt-1 text-[15px] text-ink-secondary">Your level, streak, and lifetime stats across every game.</p>

      <section className="mt-6 rounded-[28px] bg-surface p-6">
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

            {/* XP bar */}
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-secondary">
                <span><span className="text-ink">{into}</span> / {needed} XP</span>
                <span>Level {level + 1}</span>
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-full bg-background">
                <motion.div
                  className="h-full rounded-full bg-correct"
                  initial={{ width: 0 }}
                  animate={{ width: `${needed > 0 ? (into / needed) * 100 : 0}%` }}
                  transition={{ type: "spring", damping: 24, stiffness: 180 }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 divide-x divide-border">
              <StatCell value={streak} label="Streak" accent="#FF7A00" note={streak > 0 ? `×${streakMultiplier(streak).toFixed(2)} XP` : undefined} />
              <StatCell value={profile?.days_played ?? 0} label="Days" />
              <StatCell value={profile?.xp ?? 0} label="XP" accent="#00C853" />
            </div>

            <div className="mt-4 text-center">
              <UsernameEditor current={profile?.username ?? ""} onSave={claim} />
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
          <PersonalStats
            longestStreak={profile?.longest_streak ?? 0}
            totalScore={profile?.total_score ?? 0}
          />
          <GameStats />
          <Achievements earned={profile?.achievements ?? []} />
        </>
      )}
    </main>
  );
}

function PersonalStats({ longestStreak, totalScore }: { longestStreak: number; totalScore: number }) {
  const results = usePlayedResults();
  const list = Object.values(results);
  const played = list.length;
  const cleared = list.filter((r) => r.rounds > 0 && r.reached >= r.rounds).length;
  const clearRate = played ? Math.round((cleared / played) * 100) : 0;
  const best = list.reduce((m, r) => Math.max(m, r.reached), 0);

  // Every daily game counts as one play - Chain days + recorded quick games.
  const [quickPlays, setQuickPlays] = useState(0);
  useEffect(() => {
    fetch(`/api/modes/stats?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { stats?: Record<string, { played: number }> }) =>
        setQuickPlays(Object.values(d.stats ?? {}).reduce((a, s) => a + s.played, 0))
      )
      .catch(() => setQuickPlays(0));
  }, []);

  return (
    <section className="mt-4 rounded-[28px] bg-surface p-6">
      <h2 className="text-sm font-extrabold text-ink">Lifetime stats</h2>
      <div className="mt-4 grid grid-cols-3 gap-y-5">
        <Metric value={played + quickPlays} label="Games" />
        <Metric value={cleared} label="Cleared" />
        <Metric value={`${clearRate}%`} label="Clear rate" />
        <Metric value={longestStreak} label="Best streak" accent="#FF7A00" />
        <Metric value={best} label="Best run" />
        <Metric value={totalScore} label="Total score" accent="#00C853" />
      </div>
    </section>
  );
}

function Metric({ value, label, accent }: { value: number | string; label: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center px-1">
      <span
        className={`tabular text-2xl font-extrabold leading-none ${accent ? "" : "text-ink"}`}
        style={accent ? { color: accent } : undefined}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      <span className="mt-1.5 small-caps text-[9px] text-ink-secondary">{label}</span>
    </div>
  );
}

function Achievements({ earned }: { earned: string[] }) {
  const earnedSet = new Set(earned);
  return (
    <section className="mt-4 mb-2 rounded-[28px] bg-surface p-6">
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
              className={`group relative flex cursor-help flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition-colors ${
                got ? "border-correct/30 bg-correct/5" : "border-border bg-background"
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
          stroke="#00C853"
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
