"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/clientTrack";
import { LIVE_MODES } from "@/lib/modes";
import { useArchiveScores } from "@/hooks/useArchiveScores";
import { useDailyStanding } from "@/hooks/useDailyStanding";
import { formatDisplayDate } from "@/lib/date";
import { ShareResults } from "./ShareResults";

/**
 * The end-of-card pop-up. Fires once the player finishes all four games.
 *
 * Deliberately short: the date, the total, how they did against everyone else,
 * and two things to do next. It used to also list every game's individual score
 * and a three-row slice of the board - detail that made the card longer without
 * making it say more. One number and one sentence land in the second a player
 * actually gives this.
 */
export function ResultsModal({ date, onClose }: { date: string; onClose: () => void }) {
  const dates = useMemo(() => [{ play_date: date }], [date]);
  const scoreFor = useArchiveScores(dates);
  const total = LIVE_MODES.reduce((a, m) => a + scoreFor(date, m.id).points, 0);
  const standing = useDailyStanding(date);

  useEffect(() => {
    trackEvent("results_modal_shown", { date });
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

        <div className="text-center">
          <span className="stamp-red">{formatDisplayDate(date)}</span>
          <h2 className="mt-2.5 font-display text-2xl font-semibold uppercase tracking-wide text-ink">
            Card complete
          </h2>
          <p className="mt-2">
            <span className="marker-gold font-condensed text-[44px] font-semibold leading-none text-ink tabular">
              {total.toLocaleString()}
            </span>
          </p>
          <p className="small-caps mt-1 text-[10px] font-bold text-ink-secondary">points</p>
        </div>

        {/* How they did - the one line worth reading, and a bar to see it in. */}
        <div className="mt-4 min-h-[62px]">
          {standing ? (
            <>
              <p className="text-center font-condensed text-[22px] font-semibold leading-tight text-ink">
                {standing.total <= 1 ? (
                  <>
                    You&apos;re <span className="marker-gold">first in</span> today
                  </>
                ) : (
                  <>
                    You beat <span className="marker-gold">{standing.beatPct}%</span> of players
                  </>
                )}
              </p>
              <div className="relative mt-2.5 h-3.5 w-full rounded-full border-2 border-ink bg-background">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-l-full bg-[#FFB300]"
                  initial={{ width: 0 }}
                  animate={{ width: `${standing.beatPct}%` }}
                  transition={{ delay: 0.15, type: "spring", damping: 26, stiffness: 140 }}
                />
                <motion.div
                  className="absolute -top-1.5 h-6 w-[3px] bg-ink"
                  initial={{ left: "0%" }}
                  animate={{ left: `${standing.beatPct}%` }}
                  transition={{ delay: 0.15, type: "spring", damping: 26, stiffness: 140 }}
                />
              </div>
            </>
          ) : (
            <p className="pt-4 text-center text-xs text-ink-secondary">Working out how you did…</p>
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
