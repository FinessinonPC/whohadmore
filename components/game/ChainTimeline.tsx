"use client";

import { motion } from "framer-motion";

interface ChainTimelineProps {
  position: number; // rounds completed (0..total)
  total: number; // number of rounds
  wrongRounds: number[]; // 0-based round indices missed
}

const spring = { type: "spring" as const, damping: 18, stiffness: 240 };

/**
 * Lesson-progress style timeline: a little explorer walks the path toward a
 * finish flag, with red blips marking the rounds you missed.
 */
export function ChainTimeline({ position, total, wrongRounds }: ChainTimelineProps) {
  const pct = total > 0 ? Math.min(100, (position / total) * 100) : 0;

  return (
    <div className="shrink-0 px-3 pt-3">
      <div className="relative mx-auto h-9 max-w-md">
        {/* Track */}
        <div className="absolute inset-x-0 top-[60%] h-2 -translate-y-1/2 rounded-full bg-border" />
        {/* Filled portion */}
        <motion.div
          className="absolute left-0 top-[60%] h-2 -translate-y-1/2 rounded-full bg-correct"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={spring}
        />

        {/* Wrong blips */}
        {wrongRounds.map((w, i) => (
          <span
            key={`${w}-${i}`}
            className="absolute top-[60%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-wrong shadow"
            style={{ left: `${((w + 0.5) / total) * 100}%` }}
            title="Missed"
          />
        ))}

        {/* Finish flag */}
        <span className="absolute right-0 top-[60%] -translate-y-1/2 text-lg leading-none">🏁</span>

        {/* Character */}
        <motion.div
          className="absolute top-[60%] z-10 -translate-y-1/2"
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={spring}
          style={{ x: "-50%" }}
        >
          <motion.div
            animate={{ y: [0, -2.5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-background text-sm shadow-md"
          >
            🚶
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
