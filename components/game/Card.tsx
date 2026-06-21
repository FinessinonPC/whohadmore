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
  revealValue: boolean;
  animateValue: boolean;
  status: CardStatus;
  shake: boolean;
  disabled: boolean;
  onSelect: () => void;
}

const BORDER_COLOR: Record<CardStatus, string> = {
  idle: "#111111",
  correct: "#00C853",
  wrong: "#FF3B30",
};

const TINT_COLOR: Record<CardStatus, string> = {
  idle: "rgba(0,0,0,0)",
  correct: "rgba(0,200,83,0.34)",
  wrong: "rgba(255,59,48,0.34)",
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
      className="group relative flex h-full w-full flex-col justify-end overflow-hidden border-[3px] bg-ink text-left will-change-transform disabled:cursor-default"
      animate={{
        x: shake ? [0, -10, 10, -8, 8, 0] : 0,
        borderColor: BORDER_COLOR[status],
        scale: status === "correct" ? [1, 1.025, 1] : 1,
      }}
      transition={{
        x: { duration: 0.42, ease: "easeInOut" },
        scale: { duration: 0.45, ease: "easeOut" },
        borderColor: { duration: 0.2 },
      }}
      whileHover={!disabled ? { scale: 1.015 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
    >
      {/* Image fills the whole card (premium full-bleed, both desktop & mobile).
          object-center keeps subjects framed across the different card aspects. */}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts (manual overrides) can't be statically allow-listed
        <img
          src={card.image_url ?? ""}
          alt={card.entity_name}
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink to-[#2A2A2A] font-condensed text-7xl font-bold text-white/85">
          {initialsFor(card.entity_name)}
        </div>
      )}

      {/* Scrim for legibility — strong at the bottom, light up top for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />

      {/* Verdict wash */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ backgroundColor: TINT_COLOR[status] }}
        transition={{ duration: 0.25 }}
      />

      {/* Thin keyline frame — editorial print detail */}
      <div className="pointer-events-none absolute inset-[10px] border border-white/25" />

      {/* Caption block */}
      <div className="relative z-10 flex flex-col items-start gap-1 p-4 sm:p-5">
        <span className="line-clamp-2 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-white/85 sm:text-xs">
          {card.entity_name}
        </span>
        <span className="font-condensed text-[3.25rem] font-bold leading-[0.9] tracking-tight text-white drop-shadow-md sm:text-[5rem]">
          {!revealValue ? (
            "?"
          ) : animateValue ? (
            <CountUp value={card.stat_value} run={revealValue} />
          ) : (
            formatStat(card.stat_value)
          )}
        </span>
        {statUnit && revealValue && (
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65 sm:text-xs">
            {statUnit}
          </span>
        )}
      </div>
    </motion.button>
  );
}
