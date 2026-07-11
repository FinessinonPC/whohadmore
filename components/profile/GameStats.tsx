"use client";

import { useEffect, useState } from "react";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { LIVE_MODES } from "@/lib/modes";
import { getSessionId } from "@/lib/playStore";
import { chainDailyScore } from "@/lib/leaderboard";
import { usePlayedResults } from "@/hooks/usePlayedResults";

interface ModeAgg {
  played: number;
  best: number;
  total: number;
}

/**
 * Lifetime stats, one row per game, all on the same 0–1000 daily-points scale so
 * no game looks bigger than another. Chain's aggregates come from the player's
 * recorded results; the quick games come from /api/modes/stats. Points here are
 * distinct from XP (which levels you up) - called out in the copy.
 */
export function GameStats() {
  const [stats, setStats] = useState<Record<string, ModeAgg>>({});
  const chainResults = usePlayedResults();

  useEffect(() => {
    fetch(`/api/modes/stats?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { stats?: Record<string, ModeAgg> }) => setStats(d.stats ?? {}))
      .catch(() => setStats({}));
  }, []);

  // Chain's lifetime points on the same scale as the quick games.
  const chainScores = Object.values(chainResults).map((r) =>
    chainDailyScore(r.reached, r.rounds)
  );
  const chainAgg: ModeAgg = {
    played: chainScores.length,
    best: chainScores.reduce((m, s) => Math.max(m, s), 0),
    total: chainScores.reduce((a, s) => a + s, 0),
  };

  const aggFor = (id: string): ModeAgg =>
    id === "chain" ? chainAgg : stats[id] ?? { played: 0, best: 0, total: 0 };

  const totalPlays = LIVE_MODES.reduce((a, m) => a + aggFor(m.id).played, 0);
  const totalPoints = LIVE_MODES.reduce((a, m) => a + aggFor(m.id).total, 0);
  const avgScore = totalPlays > 0 ? Math.round(totalPoints / totalPlays) : 0;
  const maxed = LIVE_MODES.filter((m) => aggFor(m.id).best >= 1000).length;

  return (
    <section className="mt-4 card-ink rounded-2xl p-6">
      <h2 className="text-sm font-extrabold text-ink">Across every game</h2>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-secondary">
        Points are how you score each day - up to 1,000 a game. (Separate from XP, which
        levels you up over time.)
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <Big value={totalPlays} label="Games played" />
        <Big value={avgScore} label="Avg score" />
        <Big value={maxed} label="Games maxed" />
      </div>

      <h2 className="mt-6 text-sm font-extrabold text-ink">By game</h2>
      <div className="mt-4 flex flex-col gap-3">
        {LIVE_MODES.map((m) => {
          const agg = aggFor(m.id);
          const avg = agg.played > 0 ? Math.round(agg.total / agg.played) : 0;
          return (
            <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-border bg-background px-4 py-3">
              <span className="w-24 shrink-0" style={{ color: m.accent }}>
                <GameWordmark mode={m.id} className="text-xl" />
              </span>
              <div className="flex min-w-0 flex-1 items-baseline justify-end gap-5 text-right">
                <Stat label="played" value={agg.played} />
                <Stat label="avg" value={avg} />
                <Stat label="best" value={agg.best} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-secondary">
        Quick-game stats count days recorded on the server.
      </p>
    </section>
  );
}

function Big({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="tabular font-condensed text-3xl font-semibold text-ink">
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">{label}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="whitespace-nowrap">
      <span className="tabular font-condensed text-xl font-semibold text-ink">
        {value.toLocaleString()}
      </span>
      <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">
        {label}
      </span>
    </span>
  );
}
