"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/Logo";
import { useProfile } from "@/hooks/useProfile";
import {
  ACHIEVEMENTS,
  XP_PER_LEVEL,
  levelFromXp,
  rankTitle,
  streakMultiplier,
  xpIntoLevel,
  type LeaderboardRow,
} from "@/lib/leaderboard";

export function LeaderboardView() {
  const { profile, rank, loading, claim } = useProfile();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d: { rows: LeaderboardRow[] }) => setRows(d.rows ?? []))
      .catch(() => setRows([]));
  }, [profile]);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await claim(username.trim());
    setSaving(false);
    if (!res.ok) setError(res.error ?? "Failed");
    else setUsername("");
  }

  const xp = profile?.xp ?? 0;
  const level = levelFromXp(xp);
  const into = xpIntoLevel(xp);
  const streak = profile?.current_streak ?? 0;
  const hasName = Boolean(profile?.username);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5">
          <BrandMark className="h-5 w-5" />
          <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
        </Link>
        <Link href="/play" className="rounded-full bg-cta px-4 py-1.5 text-xs font-semibold text-white">
          Play
        </Link>
      </header>

      <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-ink">Leaderboard</h1>

      {/* Profile card */}
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        {!hasName && (
          <>
            <p className="text-center text-sm text-ink-secondary">
              To join the leaderboard, just pick a username.
            </p>
            <div className="mt-4 flex gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && username.trim() && save()}
                placeholder="Your username"
                maxLength={20}
                className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-ink"
              />
              <Button size="lg" onClick={save} disabled={saving || !username.trim()}>
                {saving ? "…" : "Save"}
              </Button>
            </div>
            {error && <p className="mt-2 text-xs font-semibold text-wrong">{error}</p>}
          </>
        )}

        {hasName && (
          <div className="flex items-center justify-between">
            <div>
              <p className="small-caps text-[10px] text-ink-secondary">Signed in as</p>
              <p className="text-xl font-extrabold text-ink">{profile?.username}</p>
            </div>
            <UsernameEditor current={profile?.username ?? ""} onSave={claim} />
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat icon="🔥" label="Streak" value={streak} sub={streak > 0 ? `×${streakMultiplier(streak).toFixed(2)}` : undefined} />
          <Stat icon="📅" label="Days Played" value={profile?.days_played ?? 0} />
          <Stat icon="⭐" label="Total Stars" value={profile?.total_stars ?? 0} />
          <Stat
            icon="📊"
            label="Monthly Score"
            value={profile?.monthly_score ?? 0}
            sub={rank ? `#${rank}` : undefined}
          />
        </div>

        {/* Level + XP */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-sm font-bold text-ink">
              ⭐ Level {level}
            </span>
            <span className="small-caps text-xs font-semibold text-ink-secondary">
              {rankTitle(level)}
            </span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-background">
            <motion.div
              className="h-full rounded-full bg-correct"
              initial={{ width: 0 }}
              animate={{ width: `${(into / XP_PER_LEVEL) * 100}%` }}
              transition={{ type: "spring", damping: 24, stiffness: 180 }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-ink-secondary">
            <span className="font-bold text-ink">{into}</span> / {XP_PER_LEVEL} XP
          </p>
        </div>
      </section>

      {/* Achievements */}
      <section className="mt-8">
        <h2 className="mb-3 small-caps text-xs text-ink-secondary">Achievements</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const earned = profile?.achievements?.includes(a.id);
            return (
              <div
                key={a.id}
                title={a.description}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                  earned ? "border-correct/40 bg-correct/5" : "border-border bg-surface opacity-55"
                }`}
              >
                <span className="text-2xl" style={{ filter: earned ? "none" : "grayscale(1)" }}>
                  {a.icon}
                </span>
                <span className="text-[11px] font-bold text-ink">{a.label}</span>
                <span className="text-[10px] leading-tight text-ink-secondary">{a.description}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ranked list */}
      <section className="mt-8">
        <h2 className="mb-3 small-caps text-xs text-ink-secondary">This month</h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-ink-secondary">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-secondary">
            No scores yet this month — be the first.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {rows.map((r) => {
              const me = r.username === profile?.username;
              return (
                <li
                  key={r.rank}
                  className={`flex items-center gap-3 px-4 py-3 ${me ? "bg-correct/5" : "bg-surface"}`}
                >
                  <span className="w-7 text-center tabular text-sm font-extrabold text-ink-secondary">
                    {r.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                    {r.username} {me && <span className="text-ink-secondary">(you)</span>}
                  </span>
                  <span className="text-xs text-ink-secondary">Lv {r.level}</span>
                  <span className="tabular text-sm font-extrabold text-ink">
                    {r.monthly_score.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-xl">{icon}</span>
      <span className="mt-1 flex items-baseline gap-1">
        <span className="tabular text-2xl font-extrabold text-ink">{value.toLocaleString()}</span>
        {sub && <span className="text-xs font-semibold text-ink-secondary">{sub}</span>}
      </span>
      <span className="mt-0.5 small-caps text-[10px] text-ink-secondary">{label}</span>
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
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        Edit
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={20}
        className="h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ink"
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
