"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TopNav } from "@/components/ui/TopNav";
import { useProfile } from "@/hooks/useProfile";
import { getSessionId } from "@/lib/playStore";
import {
  levelInfo,
  rankTitle,
  streakMultiplier,
  type DailyRow,
  type LeaderboardRow,
} from "@/lib/leaderboard";

const MEDAL = ["#FFB300", "#B8C2CC", "#CD7F32"]; // gold / silver / bronze

export function LeaderboardView() {
  const { profile, rank, loading, claim } = useProfile();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [dailyRounds, setDailyRounds] = useState(0);
  const [tab, setTab] = useState<"daily" | "alltime">("daily");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d: { rows: LeaderboardRow[] }) => setRows(d.rows ?? []))
      .catch(() => setRows([]));
    fetch(`/api/leaderboard/daily?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { rows: DailyRow[]; rounds: number }) => {
        setDaily(d.rows ?? []);
        setDailyRounds(d.rounds ?? 0);
      })
      .catch(() => setDaily([]));
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
  const { level, into, needed } = levelInfo(xp);
  const streak = profile?.current_streak ?? 0;
  const hasName = Boolean(profile?.username);

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-5 sm:max-w-2xl">
      <TopNav />

      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-ink">Leaderboard</h1>
      <p className="mt-1 text-[15px] text-ink-secondary">Climb the board with every game you play.</p>

      {/* Profile / join card */}
      <section className="mt-6 rounded-[28px] bg-surface p-6">
        {!hasName ? (
          <div className="text-center">
            <p className="text-xl font-extrabold text-ink">Join the leaderboard</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink-secondary">
              Pick a username to bank your XP, build a streak, and climb the ranks.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && username.trim() && save()}
                placeholder="Choose a username"
                maxLength={20}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-center text-base font-semibold outline-none focus:border-ink"
              />
              <Button size="lg" onClick={save} disabled={saving || !username.trim()} className="w-full">
                {saving ? "Saving…" : "Claim username"}
              </Button>
            </div>
            {error && <p className="mt-2 text-sm font-semibold text-wrong">{error}</p>}
          </div>
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
              <StatCell value={streak} label="Streak" accent="#FF7A00" note={streak > 0 ? `×${streakMultiplier(streak).toFixed(2)}` : undefined} />
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

      {/* Ranked list with Daily / All-time toggle */}
      <section className="mt-9">
        <div className="mb-3 inline-flex rounded-full bg-surface p-1">
          <TabButton active={tab === "daily"} onClick={() => setTab("daily")}>
            Daily
          </TabButton>
          <TabButton active={tab === "alltime"} onClick={() => setTab("alltime")}>
            All time
          </TabButton>
        </div>

        {tab === "daily" ? (
          daily.length === 0 ? (
            <EmptyBoard
              title="No scores yet today"
              sub="Be the first to play today's game."
            />
          ) : (
            <div className="overflow-hidden rounded-3xl bg-surface">
              {daily.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/70" : ""} ${
                    r.you ? "bg-correct/10" : ""
                  }`}
                >
                  <RankBadge rank={r.rank} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[15px] font-bold ${
                        r.name === "Anonymous" && !r.you ? "text-ink-secondary" : "text-ink"
                      }`}
                    >
                      {r.name}
                      {r.you && <span className="ml-1 text-ink-secondary">· You</span>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-secondary">
                      {r.reached}
                      {dailyRounds > 0 ? `/${dailyRounds}` : ""} correct
                      {" · "}
                      {r.hearts}
                      <span className="text-wrong">♥</span>
                      {r.timeSeconds != null && <>{" · "}{formatClock(r.timeSeconds)}</>}
                    </p>
                  </div>
                  <span className="tabular text-base font-extrabold text-ink">
                    {r.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : loading ? (
          <p className="py-8 text-center text-sm text-ink-secondary">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyBoard title="No scores yet" sub="Play games to climb the all-time board." />
        ) : (
          <div className="overflow-hidden rounded-3xl bg-surface">
            {rows.map((r, i) => {
              const me = r.username === profile?.username;
              return (
                <div
                  key={r.rank}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border/70" : ""} ${
                    me ? "bg-correct/10" : ""
                  }`}
                >
                  <RankBadge rank={r.rank} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                    {r.username}
                    {me && <span className="ml-1 text-ink-secondary">· You</span>}
                  </span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-bold text-ink-secondary">
                    Lv {r.level}
                  </span>
                  <span className="tabular text-base font-extrabold text-ink">
                    {r.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function formatClock(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
        active ? "bg-background text-ink shadow-sm" : "text-ink-secondary hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyBoard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-3xl bg-surface px-6 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-secondary">{sub}</p>
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

function RankBadge({ rank }: { rank: number }) {
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;
  if (medal) {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
        style={{ backgroundColor: medal }}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-sm font-extrabold text-ink-secondary">
      {rank}
    </span>
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
