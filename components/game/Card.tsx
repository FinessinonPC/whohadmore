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
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 bg-surface text-left disabled:cursor-default"
      animate={{
        x: shake ? [0, -8, 8, -6, 6, 0] : 0,
        borderColor: BORDER_COLOR[status],
        scale: status === "correct" ? [1, 1.03, 1] : 1,
      }}
      transition={{
        x: { duration: 0.4, ease: "easeInOut" },
        scale: { duration: 0.5, ease: "easeOut" },
        borderColor: { duration: 0.2 },
      }}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}
    >
      {/* Image — top portion of the card */}
      <div className="relative aspect-square w-full overflow-hidden bg-border/40">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts (manual overrides) can't be statically allow-listed
          <img
            src={card.image_url ?? ""}
            alt={card.entity_name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-border/40 text-2xl font-extrabold text-ink-secondary">
            {initialsFor(card.entity_name)}
          </div>
        )}
      </div>

      {/* Name + value */}
      <div className="flex flex-1 flex-col items-center gap-2 px-3 py-4">
        <span className="line-clamp-2 text-center text-sm font-bold leading-tight text-ink">
          {card.entity_name}
        </span>

        <div className="flex flex-col items-center">
          <span className="tabular text-display-sm font-extrabold leading-none text-ink">
            {!revealValue ? (
              <span className="text-ink-secondary">?</span>
            ) : animateValue ? (
              <CountUp value={card.stat_value} run={revealValue} />
            ) : (
              formatStat(card.stat_value)
            )}
          </span>
          {statUnit && revealValue && (
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
              {statUnit}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
