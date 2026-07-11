"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/ui/TopNav";
import { useProfile } from "@/hooks/useProfile";
import { getSessionId } from "@/lib/playStore";
import { type DailyRow, type LeaderboardRow } from "@/lib/leaderboard";

const MEDAL = ["#FFB300", "#B8C2CC", "#CD7F32"]; // gold / silver / bronze

export function LeaderboardView({
  initialRows = [],
  initialDaily = [],
  initialDailyRounds = 0,
}: {
  initialRows?: LeaderboardRow[];
  initialDaily?: DailyRow[];
  initialDailyRounds?: number;
}) {
  const { profile } = useProfile();
  // Server-rendered data shows immediately; the client re-fetch below only
  // exists to mark "you" (the viewer's session id isn't known at SSR time),
  // so it enhances what's already on screen instead of starting from empty.
  const [rows] = useState<LeaderboardRow[]>(initialRows);
  const [daily, setDaily] = useState<DailyRow[]>(initialDaily);
  const [dailyRounds, setDailyRounds] = useState(initialDailyRounds);
  const [tab, setTab] = useState<"daily" | "alltime">("daily");

  useEffect(() => {
    fetch(`/api/leaderboard/daily?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { rows: DailyRow[]; rounds: number }) => {
        setDaily(d.rows ?? []);
        setDailyRounds(d.rounds ?? 0);
      })
      .catch(() => {});
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
        <div className="card-ink-flat mb-3 inline-flex rounded-full p-1">
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
            <div className="card-ink tilt-l overflow-hidden rounded-xl">
              {daily.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/70" : ""} ${
                    r.you ? "bg-[#FFB300]/20 ring-2 ring-inset ring-[#FFB300]" : ""
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
          <div className="card-ink tilt-l overflow-hidden rounded-xl">
            {rows.map((r, i) => {
              const me = r.username === profile?.username;
              return (
                <div
                  key={r.rank}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border/70" : ""} ${
                    me ? "bg-[#FFB300]/20 ring-2 ring-inset ring-[#FFB300]" : ""
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
        active ? "bg-cta text-background" : "text-ink-secondary hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyBoard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card-ink tilt-l rounded-xl px-6 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-secondary">{sub}</p>
      <Link href="/" className="ink-shadow-sm mt-4 inline-block rounded-full border-2 border-ink bg-cta px-5 py-2 text-xs font-bold text-background">
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
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink font-condensed text-sm font-semibold text-[#16181D]"
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
