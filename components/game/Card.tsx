"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CountUp } from "./CountUp";
import { formatStat } from "@/lib/gameLogic";
import { initialsFor } from "@/lib/wikimedia";
import type { GameCard } from "@/types";

export type CardStatus = "idle" | "correct" | "wrong";

interface CardProps {
  card: GameCard;
  statUnit: string | null;
  /** Show the numeric value (left = always; right = only after a correct reveal). */
  revealValue: boolean;
  /** Animate the value counting up from 0 when revealed. */
  animateValue: boolean;
  status: CardStatus;
  shake: boolean;
  disabled: boolean;
  onSelect: () => void;
}

const BORDER_COLOR: Record<CardStatus, string> = {
  idle: "#E8E8E8",
  correct: "#00C853",
  wrong: "#FF3B30",
};

// Subtle surface tint on reveal — a touch of betting-app energy.
const BG_COLOR: Record<CardStatus, string> = {
  idle: "#F8F8F8",
  correct: "rgba(0, 200, 83, 0.07)",
  wrong: "rgba(255, 59, 48, 0.07)",
};

export function Card({
  card,
  statUnit,
  revealValue,
  animateValue,
  status,
  shake,
  disabled,
  onSelect,
}: CardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(card.image_url) && !imgFailed;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={`Choose ${card.entity_name}`}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border-2 text-left will-change-transform disabled:cursor-default"
      animate={{
        x: shake ? [0, -9, 9, -7, 7, 0] : 0,
        borderColor: BORDER_COLOR[status],
        backgroundColor: BG_COLOR[status],
        scale: status === "correct" ? [1, 1.035, 1] : 1,
      }}
      transition={{
        x: { duration: 0.42, ease: "easeInOut" },
        scale: { duration: 0.45, ease: "easeOut" },
        borderColor: { duration: 0.2 },
      }}
      whileHover={!disabled ? { scale: 1.025 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
    >
      {/* Image — the dominant element of the card */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-border/40 sm:aspect-[4/5]">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts (manual overrides) can't be statically allow-listed
          <img
            src={card.image_url ?? ""}
            alt={card.entity_name}
            className="h-full w-full object-cover"
            draggable={false}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-border/40 text-5xl font-extrabold text-ink-secondary">
            {initialsFor(card.entity_name)}
          </div>
        )}
      </div>

      {/* Name + value */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-5">
        <span className="line-clamp-2 text-center text-base font-bold leading-tight text-ink sm:text-lg">
          {card.entity_name}
        </span>

        <div className="flex flex-col items-center">
          <span className="tabular text-[2.75rem] font-black leading-none text-ink sm:text-[3.5rem]">
            {!revealValue ? (
              <span className="text-ink-secondary">?</span>
            ) : animateValue ? (
              <CountUp value={card.stat_value} run={revealValue} />
            ) : (
              formatStat(card.stat_value)
            )}
          </span>
          {statUnit && revealValue && (
            <span className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              {statUnit}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
