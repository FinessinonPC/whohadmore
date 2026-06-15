"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max: number;
}

/** Thin bar pinned to the very top of the screen; fills as the score climbs. */
export function ProgressBar({ value, max }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="fixed inset-x-0 top-0 z-40 h-[3px] w-full bg-border/60">
      <motion.div
        className="h-full bg-correct"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", damping: 26, stiffness: 200 }}
      />
    </div>
  );
}
