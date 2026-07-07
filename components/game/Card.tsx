"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CountUp } from "./CountUp";
import { formatStat } from "@/lib/gameLogic";
import { imageCreditUrl, initialsFor } from "@/lib/wikimedia";
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
 * A game card: the photo IS the card - full bleed, edge to edge. The entity
 * name and stat ride in compact white pills tucked against the bottom edge so
 * they cover as little of the picture as possible ("?" until this side
 * reveals). A whisper-quiet credit chip in the top corner links to the
 * image's source page.
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
    <div className="relative h-full w-full">
      <motion.button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-label={`Choose ${card.entity_name}`}
        className="group relative flex h-full w-full items-end justify-center overflow-hidden rounded-[26px] border-[3px] bg-[#F1F1F3] text-left shadow-xl will-change-transform disabled:cursor-default"
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
        {/* The photo IS the card */}
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
          <div className="absolute inset-0 flex items-center justify-center bg-[#E4E5E9] font-condensed text-7xl font-bold text-[#AFB3BC]">
            {initialsFor(card.entity_name)}
          </div>
        )}

        {/* Verdict wash */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ backgroundColor: TINT_COLOR[status] }}
          transition={{ duration: 0.25 }}
        />

        {/* Name + value: compact pills hugging the bottom edge, off the subject */}
        <div className="relative z-10 mb-3 flex max-w-[94%] flex-col items-center gap-1.5 px-2">
          <span className="line-clamp-2 rounded-xl border border-black/10 bg-white/95 px-3.5 py-1 text-center text-[13px] font-bold leading-snug text-[#101318] shadow-md sm:px-4 sm:text-sm">
            {card.entity_name}
          </span>
          <span className="tabular rounded-lg border border-black/10 bg-white/95 px-3 py-0.5 text-center font-condensed text-xl font-semibold text-[#101318] shadow-md sm:text-2xl">
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
                  <span className="ml-1 text-xs font-bold text-[#5A6068] sm:text-sm">
                    {statUnit}
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      </motion.button>

      {/* Subtle image credit - outside the button so tapping it never guesses */}
      {hasImage && card.image_url && (
        <a
          href={imageCreditUrl(card.image_url)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Image source for ${card.entity_name}`}
          className="absolute right-3 top-3 z-20 rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-semibold text-white/60 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white"
        >
          photo
        </a>
      )}
    </div>
  );
}
