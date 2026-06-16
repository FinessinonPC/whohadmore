"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

export interface HeartLossEvent {
  key: number;
  before: number; // lives before the loss
}

function Heart({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ filter: "drop-shadow(0 3px 7px rgba(0,0,0,0.55))" }}
    >
      <path d={HEART} fill="#FF3B30" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Full-screen flourish when a life is lost: the hearts gather to the center, the
 * lost one cracks into two halves that fall, and the survivors zip back up to
 * the corner where they live.
 */
export function HeartLossOverlay({
  event,
  max,
}: {
  event: HeartLossEvent | null;
  max: number;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!event) return;
    setActive(true);
    const t = setTimeout(() => setActive(false), 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.key]);

  const before = event?.before ?? max;

  return (
    <AnimatePresence>
      {active && event && (
        <motion.div
          key={event.key}
          className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center gap-4">
            {Array.from({ length: before }).map((_, i) => {
              const lost = i === before - 1;
              if (lost) return <BreakingHeart key="lost" />;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1.7, 1.7, 0.5],
                    y: [0, 0, 0, -240],
                    x: [0, 0, 0, 280],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{ duration: 1.2, times: [0, 0.2, 0.62, 1], ease: "easeInOut", delay: i * 0.05 }}
                >
                  <Heart className="h-16 w-16 drop-shadow-lg" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BreakingHeart() {
  const halfTransition = { duration: 1.2, times: [0, 0.2, 0.5, 1], ease: "easeIn" as const };
  return (
    <div className="relative h-16 w-16">
      <motion.div
        className="absolute inset-0"
        style={{ clipPath: "inset(0 50% 0 0)" }}
        initial={{ scale: 0, opacity: 0, x: 0, y: 0, rotate: 0 }}
        animate={{
          scale: [0, 1.7, 1.7, 1.2],
          x: [0, 0, 0, -100],
          y: [0, 0, 0, 150],
          rotate: [0, 0, 0, -60],
          opacity: [0, 1, 1, 0],
        }}
        transition={halfTransition}
      >
        <Heart className="h-16 w-16 drop-shadow-lg" />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        style={{ clipPath: "inset(0 0 0 50%)" }}
        initial={{ scale: 0, opacity: 0, x: 0, y: 0, rotate: 0 }}
        animate={{
          scale: [0, 1.7, 1.7, 1.2],
          x: [0, 0, 0, 100],
          y: [0, 0, 0, 150],
          rotate: [0, 0, 0, 60],
          opacity: [0, 1, 1, 0],
        }}
        transition={halfTransition}
      >
        <Heart className="h-16 w-16 drop-shadow-lg" />
      </motion.div>
    </div>
  );
}
