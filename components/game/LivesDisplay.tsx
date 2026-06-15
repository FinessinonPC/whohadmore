"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { STARTING_LIVES } from "@/lib/gameLogic";

// Classic heart silhouette.
const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

interface LivesDisplayProps {
  lives: number;
  max?: number;
  size?: "sm" | "md";
}

/**
 * Lives as hearts. A lost heart gives a scale-punch and drains from red to grey
 * — the moment a life goes is meant to feel real.
 */
export function LivesDisplay({ lives, max = STARTING_LIVES, size = "md" }: LivesDisplayProps) {
  // Detect which heart just flipped to empty so only that one pops.
  const prev = useRef(lives);
  const justLost = prev.current > lives ? lives : -1;
  useEffect(() => {
    prev.current = lives;
  }, [lives]);

  const dim = size === "sm" ? "h-4 w-4" : "h-[22px] w-[22px]";

  return (
    <div className="flex items-center gap-1" aria-label={`${lives} lives remaining`}>
      {Array.from({ length: max }).map((_, i) => {
        const alive = i < lives;
        const popped = i === justLost;
        return (
          <motion.svg
            key={i}
            viewBox="0 0 24 24"
            className={dim}
            initial={false}
            animate={{ scale: popped ? [1, 1.45, 0.82, 1.08, 1] : 1 }}
            transition={{ duration: popped ? 0.5 : 0.2, ease: "easeOut" }}
          >
            <motion.path
              d={HEART}
              initial={false}
              animate={{ fill: alive ? "#FF3B30" : "#E8E8E8" }}
              transition={{ duration: 0.3 }}
            />
          </motion.svg>
        );
      })}
    </div>
  );
}
