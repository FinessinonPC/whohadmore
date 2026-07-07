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
  idle: "rgba(0,0,0,0)",
  correct: "#00C853",
  wrong: "#FF3B30",
};

const TINT_COLOR: Record<CardStatus, string> = {
  idle: "rgba(0,0,0,0)",
  correct: "rgba(0,200,83,0.30)",
  wrong: "rgba(255,59,48,0.30)",
};

/**
 * A game card in the light-panel format: an off-white rounded panel (it stays
 * light in dark mode - that's the look), the picture framed inside it, and
 * the entity name floating at center in a white pill. The stat value joins as
 * a second pill: "?" until this side reveals.
 */
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
      className="group relative flex h-full w-full items-center justify-center overflow-hidden rounded-[26px] border-[3px] bg-[#F1F1F3] text-left shadow-xl will-change-transform disabled:cursor-default"
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
      {/* The picture, framed by the panel */}
      <div className="absolute inset-3 overflow-hidden rounded-[16px] sm:inset-4">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts (manual overrides) can't be statically allow-listed
          <img
            src={card.image_url ?? ""}
            alt={card.entity_name}
            className="h-full w-full object-cover object-center"
            draggable={false}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#E4E5E9] font-condensed text-7xl font-bold text-[#AFB3BC]">
            {initialsFor(card.entity_name)}
          </div>
        )}
      </div>

      {/* Verdict wash */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[23px]"
        initial={false}
        animate={{ backgroundColor: TINT_COLOR[status] }}
        transition={{ duration: 0.25 }}
      />

      {/* Name + value, centered like the reference */}
      <div className="relative z-10 flex max-w-[92%] flex-col items-center gap-2 px-3">
        <span className="line-clamp-2 rounded-2xl border border-black/10 bg-white px-5 py-2 text-center text-base font-bold leading-snug text-[#101318] shadow-md sm:px-6 sm:py-2.5 sm:text-xl">
          {card.entity_name}
        </span>
        <span className="tabular rounded-xl border border-black/10 bg-white px-4 py-1 text-center font-condensed text-2xl font-semibold text-[#101318] shadow-md sm:text-3xl">
          {!revealValue ? (
            "?"
          ) : (
            <>
              {animateValue ? (
                <CountUp value={card.stat_value} run={revealValue} />
              ) : (
                formatStat(card.stat_value)
              )}
              {statUnit && (
                <span className="ml-1.5 text-sm font-bold text-[#5A6068] sm:text-base">
                  {statUnit}
                </span>
              )}
            </>
          )}
        </span>
      </div>
    </motion.button>
  );
}
