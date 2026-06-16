"use client";

import { motion } from "framer-motion";

/** Snappy progress bar pinned to the bottom — how far through the chain you are. */
export function ChainProgress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 h-1.5 w-full bg-border/50">
      <motion.div
        className="h-full bg-ink"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", damping: 18, stiffness: 280 }}
      />
    </div>
  );
}
