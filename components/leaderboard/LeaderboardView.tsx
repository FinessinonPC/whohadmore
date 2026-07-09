"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/ui/TopNav";
import { useProfile } from "@/hooks/useProfile";
import { getSessionId } from "@/lib/playStore";
import { type DailyRow, type LeaderboardRow } from "@/lib/leaderboard";

const MEDAL = ["#FFB300", "#B8C2CC", "#CD7F32"]; // gold / silver / bronze

export function LeaderboardView({ initialRows = [] }: { initialRows?: LeaderboardRow[] }) {
  const { profile, loading } = useProfile();
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [dailyRounds, setDailyRounds] = useState(0);
  const [tab, setTab] = useState<"daily" | "alltime">("daily");

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

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-5 sm:max-w-2xl">
      <TopNav />

      <h1 className="mt-8 font-condensed text-4xl font-semibold uppercase tracking-wide text-ink">
        Leaderboard
      </h1>
      <p className="mt-1.5 text-sm text-ink-secondary">
        Every game counts - Chain, Duality, Word and Mini roll into one daily score.
      </p>

      {/* Daily / All-time toggle */}
      <section className="mt-6">
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
            <EmptyBoard title="No scores yet today" sub="Be the first to play today's game." />
          ) : (
            <div className="overflow-hidden rounded-3xl bg-surface">
              {daily.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/70" : ""} ${
                    r.you ? "bg-correct/15 ring-1 ring-inset ring-correct/40" : ""
                  }`}
                >
                  <RankBadge rank={r.rank} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[15px] font-bold ${
                        r.anon && !r.you ? "text-ink-secondary" : "text-ink"
                      }`}
                    >
                      {r.name}
                      {r.you && <span className="ml-1.5 font-extrabold text-correct">(you)</span>}
                    </p>
                  </div>
                  <span className="tabular font-condensed text-xl font-semibold text-ink">
                    {r.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )
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
                    me ? "bg-correct/15 ring-1 ring-inset ring-correct/40" : ""
                  }`}
                >
                  <RankBadge rank={r.rank} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                    {r.username}
                    {me && <span className="ml-1.5 font-extrabold text-correct">(you)</span>}
                  </span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-bold text-ink-secondary">
                    Lv {r.level}
                  </span>
                  <span className="tabular font-condensed text-xl font-semibold text-ink">
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
      <Link href="/" className="mt-4 inline-block rounded-full bg-cta px-5 py-2 text-xs font-bold text-background">
        Play today&apos;s games
      </Link>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;
  if (medal) {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-condensed text-sm font-semibold text-[#0B0D10]"
        style={{ backgroundColor: medal }}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center font-condensed text-base font-semibold text-ink-secondary">
      {rank}
    </span>
  );
}
