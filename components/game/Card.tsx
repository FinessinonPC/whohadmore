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
  /** Show the numeric value (left = always; right = only once it's revealed). */
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

// Verdict wash over the photo — green for the right answer, red for a miss.
const TINT_COLOR: Record<CardStatus, string> = {
  idle: "rgba(0,0,0,0)",
  correct: "rgba(0,200,83,0.32)",
  wrong: "rgba(255,59,48,0.32)",
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
      className="group relative flex aspect-[4/3] w-full flex-col justify-end overflow-hidden rounded-3xl border-2 bg-border/40 text-left will-change-transform disabled:cursor-default sm:aspect-[3/4]"
      animate={{
        x: shake ? [0, -9, 9, -7, 7, 0] : 0,
        borderColor: BORDER_COLOR[status],
        scale: status === "correct" ? [1, 1.03, 1] : 1,
      }}
      transition={{
        x: { duration: 0.42, ease: "easeInOut" },
        scale: { duration: 0.45, ease: "easeOut" },
        borderColor: { duration: 0.2 },
      }}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
    >
      {/* Image fills the whole card */}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts (manual overrides) can't be statically allow-listed
        <img
          src={card.image_url ?? ""}
          alt={card.entity_name}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-ink-secondary">
          {initialsFor(card.entity_name)}
        </div>
      )}

      {/* Readability scrim, strongest at the bottom where the text sits */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />

      {/* Verdict color wash */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ backgroundColor: TINT_COLOR[status] }}
        transition={{ duration: 0.25 }}
      />

      {/* Name + value, overlaid at the bottom */}
      <div className="relative z-10 flex flex-col items-center gap-1 px-3 pb-4 pt-3 text-center">
        <span className="line-clamp-2 text-base font-bold leading-tight text-white drop-shadow sm:text-lg">
          {card.entity_name}
        </span>
        <span className="tabular text-[2.75rem] font-black leading-none text-white drop-shadow-md sm:text-[3.25rem]">
          {!revealValue ? (
            "?"
          ) : animateValue ? (
            <CountUp value={card.stat_value} run={revealValue} />
          ) : (
            formatStat(card.stat_value)
          )}
        </span>
        {statUnit && revealValue && (
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            {statUnit}
          </span>
        )}
      </div>
    </motion.button>
  );
}
