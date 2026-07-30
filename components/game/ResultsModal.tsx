"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/clientTrack";
import { LIVE_MODES } from "@/lib/modes";
import { useArchiveScores } from "@/hooks/useArchiveScores";
import { getLocalResult, getSessionId } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { chainDailyScore, type DailyRow } from "@/lib/leaderboard";
import { formatDisplayDate } from "@/lib/date";
import { ShareResults } from "./ShareResults";

interface RankInfo {
  rank: number;
  total: number;
  /** Share of today's other players this score beat, 0-100. */
  beatPct: number;
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
    trackEvent("results_modal_shown", { date });
  }, [date]);

  // Rank on the SAME scale the leaderboard ranks on (dailyScore for Chain +
  // the quick-game points), merging a synthetic "you" row so it appears
  // instantly - the leaderboard write may not have landed yet.
  useEffect(() => {
    const chain = getLocalResult(date);
    const chainPts = chain ? chainDailyScore(chain.reached, chain.rounds) : 0;
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
      // Beaten = everyone ELSE scoring strictly lower. Ties don't count as beaten,
      // so the number can never flatter; with nobody else on the board yet it's
      // 0 and the copy falls back to "first one in today".
      const beaten = others.filter((r) => r.score < myScore).length;
      const beatPct = others.length > 0 ? Math.round((beaten / others.length) * 100) : 0;
      return {
        rank: idx + 1,
        total: merged.length,
        beatPct,
        window: merged.slice(start, start + 3),
      };
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

        {/* How you did. One sentence and one marker beats a table: it reads at a
            glance, it survives being screenshotted, and it stays meaningful when
            only a handful of people have played. The rank sits underneath for
            anyone who wants the precise number. */}
        <div className="card-ink-flat mt-4 px-4 py-3.5">
          {rank ? (
            <>
              <p className="text-center font-condensed text-[22px] font-semibold leading-tight text-ink">
                {rank.total <= 1 ? (
                  <>You&apos;re <span className="marker-gold">first in</span> today</>
                ) : (
                  <>
                    You beat <span className="marker-gold">{rank.beatPct}%</span> of players
                  </>
                )}
              </p>

              <div className="relative mt-3 h-3.5 w-full rounded-full border-2 border-ink bg-background">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-l-full bg-[#FFB300]"
                  initial={{ width: 0 }}
                  animate={{ width: `${rank.beatPct}%` }}
                  transition={{ delay: 0.15, type: "spring", damping: 26, stiffness: 140 }}
                />
                <motion.div
                  className="absolute -top-1.5 h-6 w-[3px] bg-ink"
                  initial={{ left: "0%" }}
                  animate={{ left: `${rank.beatPct}%` }}
                  transition={{ delay: 0.15, type: "spring", damping: 26, stiffness: 140 }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-semibold text-ink-secondary">
                <span>Lowest today</span>
                <span>Best today</span>
              </div>

              <p className="mt-2.5 text-center text-[12px] font-semibold text-ink-secondary">
                #{rank.rank} of {rank.total} today
              </p>
            </>
          ) : (
            <p className="py-6 text-center text-xs text-ink-secondary">Working out how you did…</p>
          )}
        </div>

        {/* share (the growth loop) */}
        <div className="mt-3.5">
          <ShareResults date={date} surface="results_modal" />
        </div>

        {/* past-cards nudge -> sign-up for signed-out players */}
        <Link
          href="/archive"
          onClick={() => trackEvent("past_card_click", { surface: "results_modal", date })}
          className="ink-fix wonky mt-2.5 flex items-center gap-3 border-2 border-ink bg-[#F8E6A2] px-4 py-3 text-ink ink-shadow-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
