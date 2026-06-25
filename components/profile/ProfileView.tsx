"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TopNav } from "@/components/ui/TopNav";
import { SignUpFlow } from "@/components/auth/SignUpFlow";
import { useProfile } from "@/hooks/useProfile";
import { levelInfo, rankTitle, streakMultiplier } from "@/lib/leaderboard";

/** The player's own profile: level, streak multiplier, and lifetime stats. */
export function ProfileView() {
  const { profile, rank, claim, reload } = useProfile();

  const xp = profile?.xp ?? 0;
  const { level, into, needed } = levelInfo(xp);
  const streak = profile?.current_streak ?? 0;
  const hasName = Boolean(profile?.username);

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-5 sm:max-w-2xl">
      <TopNav />

      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-ink">Profile</h1>
      <p className="mt-1 text-[15px] text-ink-secondary">Your level, streak, and lifetime stats.</p>

      <section className="mt-6 rounded-[28px] bg-surface p-6">
        {!hasName ? (
          <SignUpFlow onDone={reload} />
        ) : (
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
                <p className="text-2xl font-extrabold text-ink">{rank ? `#${rank}` : "—"}</p>
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
            <div className="mt-6 grid grid-cols-4 divide-x divide-border">
              <StatCell value={streak} label="Streak" accent="#FF7A00" note={streak > 0 ? `×${streakMultiplier(streak).toFixed(2)} XP` : undefined} />
              <StatCell value={profile?.days_played ?? 0} label="Days" />
              <StatCell value={profile?.total_stars ?? 0} label="Hearts" accent="#FF3B30" />
              <StatCell value={profile?.xp ?? 0} label="XP" accent="#00C853" />
            </div>

            <div className="mt-4 text-center">
              <UsernameEditor current={profile?.username ?? ""} onSave={claim} />
            </div>
          </>
        )}
      </section>
    </main>
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
      <span className="tabular text-2xl font-extrabold leading-none" style={{ color: accent ?? "#111111" }}>
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
