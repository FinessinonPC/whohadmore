"use client";

import { motion } from "framer-motion";
import { STARTING_LIVES } from "@/lib/gameLogic";

interface LivesDisplayProps {
  lives: number;
  max?: number;
}

/**
 * Lives as filled circles (not hearts). A lost circle scales down and fades to
 * an empty outline. Per the design, the most recently lost one gives a small
 * pop on the way out.
 */
export function LivesDisplay({ lives, max = STARTING_LIVES }: LivesDisplayProps) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${lives} lives remaining`}>
      {Array.from({ length: max }).map((_, i) => {
        const alive = i < lives;
        return (
          <motion.span
            key={i}
            className={`block h-3 w-3 rounded-full border-2 ${
              alive ? "border-lives bg-lives" : "border-border bg-transparent"
            }`}
            animate={
              alive
                ? { scale: 1, opacity: 1 }
                : { scale: [1.3, 0.85], opacity: [1, 0.35] }
            }
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
