"use client";

import { motion } from "framer-motion";

interface ChainTimelineProps {
  position: number; // rounds completed (0..total)
  total: number; // number of rounds
  wrongRounds: number[]; // 0-based round indices missed
}

/**
 * The run: how far you've got, and how long you've gone without a miss.
 *
 * This replaced a character walking toward a finish flag. That bar answered
 * "how much is left" - which, in a game where every round is pass/fail, is the
 * least interesting question available. It also said nothing about the game it
 * belonged to.
 *
 * A run is something you can LOSE, so every round costs something even once the
 * score is settled. Showing the best run alongside it gives every player a
 * target that exists on every single card, whether or not they will ever touch
 * the leaderboard.
 */

/** Rounds since the last miss, and the longest unbroken run so far. */
export function runStats(position: number, wrongRounds: number[]): { current: number; best: number } {
  const wrong = [...wrongRounds].sort((a, b) => a - b);
  let best = 0;
  let prev = -1;
  for (const w of wrong) {
    best = Math.max(best, w - prev - 1);
    prev = w;
  }
  const current = Math.max(0, position - prev - 1);
  return { current, best: Math.max(best, current) };
}

export function ChainTimeline({ position, total, wrongRounds }: ChainTimelineProps) {
  const wrong = new Set(wrongRounds);
  const { current, best } = runStats(position, wrongRounds);
  const done = position >= total;

  return (
    <div className="shrink-0 px-3 pb-1 pt-3">
      <div className="mx-auto max-w-md">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="small-caps text-[10px] font-bold text-ink-secondary">
            {done ? `${total} rounds` : `Round ${Math.min(position + 1, total)} of ${total}`}
          </span>
          <span className="font-condensed text-[15px] font-semibold text-ink">
            {current > 0 ? (
              <>
                {current} in a row
                {best > current && <span className="text-ink-secondary"> · best {best}</span>}
              </>
            ) : (
              <span className="text-ink-secondary">best {best}</span>
            )}
          </span>
        </div>

        {/* One segment per round: filled as you clear it, stamped red on a miss. */}
        <div className="flex gap-[3px]">
          {Array.from({ length: total }, (_, i) => {
            const played = i < position;
            const missed = wrong.has(i);
            return (
              <motion.div
                key={i}
                className={`h-3.5 flex-1 rounded-[3px] border-2 border-ink ${
                  !played ? "bg-background" : missed ? "bg-wrong" : "bg-correct"
                }`}
                initial={false}
                animate={{ scaleY: played ? 1 : 0.72 }}
                transition={{ type: "spring", damping: 20, stiffness: 320 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
