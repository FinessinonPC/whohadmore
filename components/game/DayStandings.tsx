"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { getSessionId } from "@/lib/playStore";
import { formatShortDate } from "@/lib/date";
import type { DailyRow } from "@/lib/leaderboard";

interface Me {
  reached: number;
  hearts: number;
  timeSeconds: number;
  score: number;
}

/**
 * The leaderboard for a single past day, shown on the archived result screen so
 * replayers can see how they stacked up against everyone who played it. The
 * player's own row is merged in client-side from their just-played score, so it
 * always appears immediately - even before the result finishes recording.
 */
export function DayStandings({ date, me }: { date: string; me: Me }) {
  const { profile } = useProfile();
  const username = profile?.username ?? null;
  const { reached, hearts, timeSeconds, score } = me;
  const [rows, setRows] = useState<DailyRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard/daily?date=${date}&session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { rows?: DailyRow[] }) => {
        if (cancelled) return;
        const others = (d.rows ?? []).filter((r) => !r.you);
        const youRow: DailyRow = {
          rank: 0,
          name: username || "You",
          anon: !username,
          score,
          reached,
          hearts,
          timeSeconds,
          you: true,
        };
        const merged = [...others, youRow]
          .sort((a, b) => b.score - a.score || (a.timeSeconds ?? 1e9) - (b.timeSeconds ?? 1e9))
          .map((r, i) => ({ ...r, rank: i + 1 }));
        setRows(merged);
      })
      .catch(() => {
        if (!cancelled) setRows(null);
      });
    return () => {
      cancelled = true;
    };
  }, [date, username, reached, hearts, timeSeconds, score]);

  return (
    <div className="card-ink-flat mt-5 w-full p-4 text-left">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-extrabold text-ink">How everyone did</p>
        <p className="text-[11px] text-ink-secondary">{formatShortDate(date)}</p>
      </div>
      {rows === null ? (
        <p className="py-5 text-center text-xs text-ink-secondary">Loading standings…</p>
      ) : (
        <div className="mt-3 max-h-64 overflow-y-auto no-scrollbar">
          {rows.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-2 py-2 ${i > 0 ? "border-t border-border/60" : ""} ${
                r.you ? "rounded-lg bg-correct/10" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-center text-xs font-bold text-ink-secondary">{r.rank}</span>
              <span
                className={`min-w-0 flex-1 truncate text-sm font-bold ${
                  r.anon && !r.you ? "text-ink-secondary" : "text-ink"
                }`}
              >
                {r.name}
                {r.you && <span className="ml-1.5 font-extrabold text-correct">(you)</span>}
              </span>
              <span className="tabular text-sm font-extrabold text-ink">{r.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
