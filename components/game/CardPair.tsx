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
  chosenSide: Side | null,
  higher: Side | "both"
): CardStatus {
  if (phase === "reveal-correct") return side === chosenSide ? "correct" : "idle";
  if (phase === "reveal-wrong") {
    if (side === chosenSide) return "wrong";
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
  // First paint uses a staggered fade-in; later swaps slide vertically.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  // Always stacked (top = left, bottom = right) on every screen size.
  const slots: { card: ActivePair["left"]; side: Side }[] = [
    { card: pair.left, side: "left" },
    { card: pair.right, side: "right" },
  ];

  const interactionLocked = phase !== "idle";

  const lv = pair.left.stat_value;
  const rv = pair.right.stat_value;
  const higher: Side | "both" = lv === rv ? "both" : lv > rv ? "left" : "right";

  return (
    <div className="relative mx-auto flex h-full w-full flex-col items-stretch gap-3">
      <AnimatePresence mode="popLayout">
        {slots.map(({ card, side }, i) => {
          const firstLoad = !mounted.current;
          return (
            <motion.div
              key={card.id}
              layout
              className="relative min-h-0 flex-1 will-change-transform"
              initial={firstLoad ? { opacity: 0, y: 18 } : { opacity: 0, y: 80, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -90, scale: 0.96 }}
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

      {/* Angular VS tag on the seam between the two cards */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-11 w-11 -rotate-6 items-center justify-center bg-ink font-condensed text-base font-bold tracking-wider text-background shadow-lg ring-2 ring-background">
          VS
        </div>
      </div>
    </div>
  );
}
