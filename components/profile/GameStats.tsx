"use client";

import { useEffect, useState } from "react";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { LIVE_MODES } from "@/lib/modes";
import { getSessionId } from "@/lib/playStore";
import { usePlayedResults } from "@/hooks/usePlayedResults";

interface ModeAgg {
  played: number;
  best: number;
  total: number;
}

/**
 * Lifetime stats broken out per game. Chain aggregates come from the player's
 * recorded results; the quick games come from /api/modes/stats. Renamed the
 * profile from a Chain scoreboard into a collection scoreboard.
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

  const chainList = Object.values(chainResults);
  const chainAgg: ModeAgg = {
    played: chainList.length,
    best: chainList.reduce((m, r) => Math.max(m, r.reached), 0),
    total: 0,
  };

  const quickPlays = Object.values(stats).reduce((a, s) => a + s.played, 0);
  const quickPoints = Object.values(stats).reduce((a, s) => a + s.total, 0);
  const perfects = Object.values(stats).reduce(
    (a, s) => a + (s.best >= 1000 ? 1 : 0),
    0
  );

  return (
    <section className="mt-4 rounded-[28px] bg-surface p-6">
      <h2 className="text-sm font-extrabold text-ink">Across every game</h2>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="tabular font-condensed text-3xl font-semibold text-ink">
            {(chainAgg.played + quickPlays).toLocaleString()}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">Total plays</p>
        </div>
        <div>
          <p className="tabular font-condensed text-3xl font-semibold text-ink">
            {quickPoints.toLocaleString()}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">Quick-game pts</p>
        </div>
        <div>
          <p className="tabular font-condensed text-3xl font-semibold text-ink">{perfects}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">Games perfected</p>
        </div>
      </div>

      <h2 className="mt-6 text-sm font-extrabold text-ink">By game</h2>
      <div className="mt-4 flex flex-col gap-3">
        {LIVE_MODES.map((m) => {
          const agg = m.id === "chain" ? chainAgg : stats[m.id];
          const played = agg?.played ?? 0;
          const avg = played > 0 && m.id !== "chain" ? Math.round((agg?.total ?? 0) / played) : null;
          return (
            <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-border bg-background px-4 py-3">
              <span className="w-24 shrink-0" style={{ color: m.accent }}>
                <GameWordmark mode={m.id} className="text-xl" />
              </span>
              <div className="flex min-w-0 flex-1 items-baseline justify-end gap-5 text-right">
                <Stat label="played" value={played} />
                {m.id === "chain" ? (
                  <Stat label="best run" value={agg?.best ?? 0} />
                ) : (
                  <>
                    <Stat label="best" value={agg?.best ?? 0} />
                    <Stat label="avg" value={avg ?? 0} />
                  </>
                )}
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
