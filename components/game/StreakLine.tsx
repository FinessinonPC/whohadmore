"use client";

import { motion } from "framer-motion";

/**
 * Days in a row, said out loud at the moment the day is banked.
 *
 * The streak already existed - it just lived on the profile page, where a
 * player sees it only if they go looking. Someone extending a six-day run
 * finished their card and was told nothing about it, which is the one moment
 * the number means anything.
 *
 * Nothing is shown for a first card. "Streak started" is a claim about a habit
 * that does not exist yet, and the first card is the busiest one there is -
 * it is also the only card carrying the home-screen prompt. A streak is worth
 * mentioning once there is actually a run to lose, which is day two.
 *
 * The second line is the whole point: a streak only motivates if you know what
 * it becomes tomorrow.
 */
export function StreakLine({ streak }: { streak: number }) {
  if (streak < 2) return null;

  return (
    <motion.div
      className="mt-3 text-center"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", damping: 26, stiffness: 260 }}
    >
      {/* No marker-gold here, deliberately. The score above and the "you beat
          68%" below both use it, and a third highlighter in one card leaves
          nothing emphasised - the eye stops picking a hero. Weight and size
          carry the number instead, pitched under the standing line so the
          social beat still leads the middle of the card. */}
      <p className="font-condensed text-[17px] font-semibold leading-tight text-ink">
        <span className="text-[19px] font-bold tabular">{streak}</span> days in a row
      </p>
      <p className="mt-0.5 text-[11px] font-semibold text-ink-secondary">
        Come back tomorrow for {streak + 1}
      </p>
    </motion.div>
  );
}
