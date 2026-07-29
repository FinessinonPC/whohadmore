"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRun } from "@/hooks/useRun";
import { endRun } from "@/lib/runStore";
import { levelInfo } from "@/lib/leaderboard";
import { useProfile } from "@/hooks/useProfile";
import { trackEvent } from "@/lib/clientTrack";

/**
 * The ticket you hold while running through the archive.
 *
 * Dealing yourself card after card is the exact situation where a site starts
 * to feel like a corridor of identical rooms. Three things stop that, and this
 * is two of them: the tally never moves and always says how far you've come,
 * and Done is one tap from any card. (The third is that every card is named -
 * that lives in the hub's masthead.) Being able to leave easily is most of what
 * makes people willing to keep going.
 */
export function RunTicket() {
  const run = useRun();
  const [summary, setSummary] = useState<{ cards: number; points: number } | null>(null);

  // The summary is rendered OUTSIDE the `run` guard on purpose: ending a run
  // clears the store, and if the summary lived under `if (!run) return null` it
  // would unmount in the same tick it was opened.
  if (!run && !summary) return null;

  return (
    <>
      {run && (
        <motion.div
          className="card-ink-flat flex items-center gap-3 px-3.5 py-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-background">
            {run.cards}
          </span>
          <span className="min-w-0 flex-1">
            <span className="small-caps block text-[9px] font-bold leading-none text-ink-secondary">On a run</span>
            <span className="tabular block font-condensed text-[15px] font-semibold leading-tight text-ink">
              {run.points.toLocaleString()} pts
            </span>
          </span>
          <button
            onClick={() => {
              trackEvent("run_end", { surface: `cards_${run.cards}` });
              setSummary({ cards: run.cards, points: run.points });
              endRun();
            }}
            className="small-caps shrink-0 py-1.5 pl-3 text-[10px] font-bold text-ink-secondary transition-colors hover:text-ink"
          >
            Done ✕
          </button>
        </motion.div>
      )}

      {summary && <RunSummary {...summary} onClose={() => setSummary(null)} />}
    </>
  );
}

/** Ending a run is a moment too - it banks the sitting instead of dumping the
 *  player back on the home page with nothing to show for it. */
function RunSummary({
  cards,
  points,
  onClose,
}: {
  cards: number;
  points: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const { profile } = useProfile();
  const { level, into } = levelInfo(profile?.total_score ?? 0);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Run over"
    >
      <motion.div
        className="absolute inset-0 bg-[#0b0906]/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="card-ink tilt-l relative z-10 w-full max-w-[340px] px-5 pb-4 pt-5 text-center"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
      >
        <span className="stamp-red">Run over</span>
        <p className="mt-3.5">
          <span className="marker-gold font-condensed text-5xl font-semibold text-ink tabular">{cards}</span>
        </p>
        <p className="small-caps mt-1 text-[10px] font-bold text-ink-secondary">
          {cards === 1 ? "Card played" : "Cards played"}
        </p>

        <div className="card-ink-flat mt-4 flex divide-x divide-border">
          <div className="flex-1 px-3 py-2.5">
            <p className="tabular font-condensed text-2xl font-semibold leading-none text-ink">
              {points.toLocaleString()}
            </p>
            <p className="small-caps mt-1 text-[9px] text-ink-secondary">Points banked</p>
          </div>
          <div className="flex-1 px-3 py-2.5">
            <p className="tabular font-condensed text-2xl font-semibold leading-none text-ink">{level}</p>
            <p className="small-caps mt-1 text-[9px] text-ink-secondary">Your level</p>
          </div>
        </div>

        {profile?.username && (
          <p className="mt-3 text-[12px] leading-snug text-ink-secondary">
            {into.toLocaleString()} points into Level {level}.
          </p>
        )}

        <button
          onClick={() => {
            onClose();
            router.push("/");
          }}
          className="ink-fix wonky mt-3.5 flex w-full items-center justify-center border-2 border-ink bg-[#F8E6A2] px-4 py-3 text-[15px] font-bold text-ink ink-shadow-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Back to today&apos;s card
        </button>
      </motion.div>
    </div>
  );
}
