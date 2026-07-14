"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { track } from "@vercel/analytics";
import { LIVE_MODES } from "@/lib/modes";
import { useArchiveScores } from "@/hooks/useArchiveScores";
import { getLocalResult, getSessionId } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { dailyScore, type DailyRow } from "@/lib/leaderboard";
import { formatDisplayDate } from "@/lib/date";
import { ShareResults } from "./ShareResults";

interface RankInfo {
  rank: number;
  total: number;
  window: { rank: number; name: string; anon: boolean; score: number; you: boolean }[];
}

/**
 * The end-of-card pop-up ("Scorecard" layout). Fires once the player finishes
 * all four games. Shows their finished total, their LIVE leaderboard rank (a
 * three-row window around them, computed the way DayStandings does so it's right
 * even before the result write lands), a prominent Share button, and a nudge
 * into past cards - which for a signed-out player leads to sign-up. Every
 * actionable tap is analytics-tracked.
 */
export function ResultsModal({ date, onClose }: { date: string; onClose: () => void }) {
  const dates = useMemo(() => [{ play_date: date }], [date]);
  const scoreFor = useArchiveScores(dates);
  const perGame = LIVE_MODES.map((m) => ({ name: m.name, score: scoreFor(date, m.id) }));
  const total = perGame.reduce((a, p) => a + p.score.points, 0);
  const max = LIVE_MODES.length * 1000;

  const [rank, setRank] = useState<RankInfo | null>(null);

  useEffect(() => {
    try {
      track("results_modal_shown");
    } catch {
      /* best-effort */
    }
  }, []);

  // Rank on the SAME scale the leaderboard ranks on (dailyScore for Chain +
  // the quick-game points), merging a synthetic "you" row so it appears
  // instantly - the leaderboard write may not have landed yet.
  useEffect(() => {
    const chain = getLocalResult(date);
    const chainPts = chain ? dailyScore(chain.reached, 0, 0) : 0;
    const modeSum = (["duality", "word", "mini"] as const).reduce(
      (a, m) => a + (getModeResult(m, date)?.score ?? 0),
      0
    );
    const myScore = chainPts + modeSum;

    let cancelled = false;
    const build = (rows: DailyRow[]) => {
      const others = rows.filter((r) => !r.you);
      const you = { rank: 0, name: "You", anon: true, score: myScore, you: true };
      const merged = [...others.map((r) => ({ rank: 0, name: r.name, anon: r.anon, score: r.score, you: false })), you]
        .sort((a, b) => b.score - a.score)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      const idx = merged.findIndex((r) => r.you);
      const start = Math.max(0, Math.min(idx - 1, merged.length - 3));
      return { rank: idx + 1, total: merged.length, window: merged.slice(start, start + 3) };
    };

    fetch(`/api/leaderboard/daily?date=${date}&session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { rows?: DailyRow[] }) => {
        if (!cancelled) setRank(build(d.rows ?? []));
      })
      .catch(() => {
        if (!cancelled) setRank(build([]));
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  // Escape closes, like any dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Card complete"
    >
      <motion.div
        className="absolute inset-0 bg-[#0b0906]/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="card-ink tilt-l relative z-10 w-full max-w-[380px] px-5 pb-4 pt-5"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2.5 top-1.5 text-2xl leading-none text-ink-secondary transition-colors hover:text-ink"
        >
          ×
        </button>

        {/* masthead */}
        <div className="text-center">
          <span className="stamp-red">{formatDisplayDate(date)}</span>
          <h2 className="mt-2.5 font-display text-2xl font-semibold uppercase tracking-wide text-ink">
            Card complete
          </h2>
          <p className="mt-1.5">
            <span className="marker-gold font-condensed text-4xl font-semibold text-ink tabular">
              {total.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-ink-secondary"> / {max.toLocaleString()} pts</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-ink-secondary">
            {perGame.map((p) => `${p.name} ${p.score.points.toLocaleString()}`).join(" · ")}
          </p>
        </div>

        {/* rank window */}
        <div className="card-ink-flat mt-4 px-3 py-2.5">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="small-caps text-[10px] font-bold text-ink-secondary">Today&apos;s board</span>
            <span className="font-condensed text-sm font-semibold text-ink">
              {rank ? `you're #${rank.rank} of ${rank.total}` : "ranking…"}
            </span>
          </div>
          {rank ? (
            rank.window.map((r, i) => (
              <div
                key={`${r.rank}-${i}`}
                className={`flex items-center gap-2.5 px-1.5 py-1.5 ${
                  r.you ? "-mx-1 rounded-lg bg-[#FFB300]/25" : i > 0 ? "border-t border-border/60" : ""
                }`}
              >
                <span className="w-5 shrink-0 text-center font-condensed text-sm font-semibold text-ink-secondary">
                  {r.rank}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm font-bold ${r.anon && !r.you ? "text-ink-secondary" : "text-ink"}`}>
                  {r.you ? "You" : r.name}
                  {r.you && <span className="ml-1.5 font-extrabold text-correct">(you)</span>}
                </span>
                <span className="tabular font-condensed text-base font-semibold text-ink">
                  {r.score.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-xs text-ink-secondary">Loading the board…</p>
          )}
        </div>

        {/* share (the growth loop) */}
        <div className="mt-3.5">
          <ShareResults date={date} surface="results_modal" />
        </div>

        {/* past-cards nudge -> sign-up for signed-out players */}
        <Link
          href="/archive"
          onClick={() => {
            try {
              track("past_card_click", { surface: "results_modal" });
            } catch {
              /* best-effort */
            }
          }}
          className="wonky mt-2.5 flex items-center gap-3 border-2 border-ink bg-[#F8E6A2] px-4 py-3 text-ink ink-shadow-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold leading-tight">Play a past card →</span>
            <span className="block text-[11px] font-semibold text-ink-secondary">
              More waiting — free once you sign in
            </span>
          </span>
        </Link>

        <button
          onClick={onClose}
          className="small-caps mt-2.5 w-full py-1 text-center text-[10px] font-bold text-ink-secondary transition-colors hover:text-ink"
        >
          Maybe later
        </button>
      </motion.div>
    </div>
  );
}
