"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Card, type CardStatus } from "./Card";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { GamePhase } from "@/hooks/useGame";
import type { ActivePair, Side } from "@/lib/gameLogic";

interface CardPairProps {
  pair: ActivePair;
  statUnit: string | null;
  phase: GamePhase;
  chosenSide: Side | null;
  revealRight: boolean;
  onGuess: (side: Side) => void;
}

function statusFor(
  side: Side,
  phase: GamePhase,
  chosenSide: Side | null,
  higher: Side | "both"
): CardStatus {
  if (phase === "reveal-correct") {
    return side === chosenSide ? "correct" : "idle";
  }
  if (phase === "reveal-wrong") {
    if (side === chosenSide) return "wrong";
    // Show the answer they should have picked.
    return higher === "both" || higher === side ? "correct" : "idle";
  }
  return "idle";
}

export function CardPair({
  pair,
  statUnit,
  phase,
  chosenSide,
  revealRight,
  onGuess,
}: CardPairProps) {
  // Desktop: cards sit side-by-side and slide horizontally.
  // Mobile: cards stack and slide vertically.
  const isRow = useMediaQuery("(min-width: 640px)");

  // First paint uses a staggered fade-up; later swaps use the directional slide.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const slots: { card: ActivePair["left"]; side: Side }[] = [
    { card: pair.left, side: "left" },
    { card: pair.right, side: "right" },
  ];

  const interactionLocked = phase !== "idle";
  const enter = isRow ? { x: 80, y: 0 } : { x: 0, y: 64 };
  const exit = isRow ? { x: -100, y: 0 } : { x: 0, y: -84 };

  const lv = pair.left.stat_value;
  const rv = pair.right.stat_value;
  const higher: Side | "both" = lv === rv ? "both" : lv > rv ? "left" : "right";

  return (
    <div className="relative flex flex-col items-stretch gap-3 sm:flex-row sm:gap-4">
      <AnimatePresence mode="popLayout">
        {slots.map(({ card, side }, i) => {
          const firstLoad = !mounted.current;
          return (
            <motion.div
              key={card.id}
              layout
              className="flex-1 will-change-transform"
              initial={
                firstLoad
                  ? { opacity: 0, y: 20 }
                  : { opacity: 0, scale: 0.96, ...enter }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, ...exit }}
              transition={
                firstLoad
                  ? { duration: 0.4, delay: i * 0.08, ease: "easeOut" }
                  : { type: "spring", damping: 30, stiffness: 320, mass: 0.8 }
              }
            >
              <Card
                card={card}
                statUnit={statUnit}
                revealValue={side === "left" ? true : revealRight}
                animateValue={side === "right"}
                status={statusFor(side, phase, chosenSide, higher)}
                shake={phase === "reveal-wrong" && chosenSide === side}
                disabled={interactionLocked}
                onSelect={() => onGuess(side)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* VS divider — purely decorative, sits over the gap (works stacked or side-by-side) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-[11px] font-extrabold tracking-wide text-ink-secondary shadow-sm">
          VS
        </div>
      </div>
    </div>
  );
}
