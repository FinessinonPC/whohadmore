"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/playStore";
import type { DailyRow } from "@/lib/leaderboard";

/**
 * The leaderboard for one archived day, shown on that day's hub. Combined
 * scores (Chain + the quick games) straight from the daily leaderboard API.
 */
export function DayBoard({ date }: { date: string }) {
  const [rows, setRows] = useState<DailyRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard/daily?date=${date}&session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { rows?: DailyRow[] }) => {
        if (!cancelled) setRows(d.rows ?? []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <section className="mt-6 rounded-3xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-condensed text-xl font-semibold uppercase tracking-wide text-ink">
          That day&apos;s board
        </h2>
        <span className="text-[11px] font-semibold text-ink-secondary">combined score</span>
      </div>

      {rows === null ? (
        <p className="py-6 text-center text-xs text-ink-secondary">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-secondary">
          Nobody on the board yet - play and claim it.
        </p>
      ) : (
        <div className="mt-3 max-h-72 overflow-y-auto no-scrollbar">
          {rows.slice(0, 25).map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-2 py-2 ${i > 0 ? "border-t border-border/60" : ""} ${
                r.you ? "rounded-lg bg-correct/10" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-center font-condensed text-sm font-semibold text-ink-secondary">
                {r.rank}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-sm font-bold ${
                  r.anon && !r.you ? "text-ink-secondary" : "text-ink"
                }`}
              >
                {r.name}
                {r.you && <span className="ml-1.5 font-extrabold text-correct">(you)</span>}
              </span>
              <span className="tabular font-condensed text-lg font-semibold text-ink">
                {r.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
