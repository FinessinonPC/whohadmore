"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Card, type CardStatus } from "./Card";
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
  chosenSide: Side | null
): CardStatus {
  if (chosenSide !== side) return "idle";
  if (phase === "reveal-correct") return "correct";
  if (phase === "reveal-wrong") return "wrong";
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
  // First paint uses a staggered fade-up; later card swaps use the slide.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const slots: { card: ActivePair["left"]; side: Side }[] = [
    { card: pair.left, side: "left" },
    { card: pair.right, side: "right" },
  ];

  const interactionLocked = phase !== "idle";

  return (
    <div className="relative flex items-stretch gap-3 sm:gap-4">
      <AnimatePresence mode="popLayout">
        {slots.map(({ card, side }, i) => {
          const firstLoad = !mounted.current;
          return (
            <motion.div
              key={card.id}
              layout
              className="flex-1"
              initial={
                firstLoad
                  ? { opacity: 0, y: 20 }
                  : { opacity: 0, x: 72, scale: 0.96 }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -96, scale: 0.96 }}
              transition={
                firstLoad
                  ? { duration: 0.4, delay: i * 0.08, ease: "easeOut" }
                  : { type: "spring", damping: 30, stiffness: 280 }
              }
            >
              <Card
                card={card}
                statUnit={statUnit}
                revealValue={side === "left" ? true : revealRight}
                animateValue={side === "right"}
                status={statusFor(side, phase, chosenSide)}
                shake={phase === "reveal-wrong" && chosenSide === side}
                disabled={interactionLocked}
                onSelect={() => onGuess(side)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* VS divider — purely decorative, sits over the gap */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-[11px] font-extrabold tracking-wide text-ink-secondary shadow-sm">
          VS
        </div>
      </div>
    </div>
  );
}
