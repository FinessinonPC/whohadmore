"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TopNav } from "@/components/ui/TopNav";
import { initialsFor } from "@/lib/wikimedia";
import { maxScore } from "@/lib/gameLogic";
import { formatDisplayDate, isToday } from "@/lib/date";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "./Fireworks";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { modeDef } from "@/lib/modes";
import { themeFor } from "@/lib/weekly";
import type { FullGame, GameCard } from "@/types";

interface StartScreenProps {
  game: FullGame;
  date: string;
  gameNumber: number;
  resuming?: boolean;
  onStart: () => void;
}

/** Pick up to n cards spread across the chain for the hero montage. */
function pickSpread(cards: GameCard[], n: number): GameCard[] {
  const withImg = cards.filter((c) => c.image_url);
  const pool = withImg.length >= 3 ? withImg : cards;
  if (pool.length <= n) return pool;
  const step = (pool.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => pool[Math.round(i * step)]);
}

export function StartScreen({ game, date, gameNumber, resuming = false, onStart }: StartScreenProps) {
  const rounds = maxScore(Math.min(game.cards.length, 11));
  const hero = pickSpread(game.cards, 5);
  const center = (hero.length - 1) / 2;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5 sm:max-w-2xl">
      {isJuly4th(date) && <Fireworks />}
      <TopNav />

      {isJuly4th(date) && (
        <div className="relative z-[46] mx-auto mt-2 rounded-full border border-[#FF3B30]/25 bg-gradient-to-r from-[#FF3B30]/12 via-transparent to-[#2E6BFF]/12 px-5 py-1.5 text-sm font-bold text-ink">
          Happy Fourth of July 🌭
        </div>
      )}

      <motion.div
        className="relative z-[46] flex flex-1 flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <span style={{ color: modeDef("chain").accent }}>
          <GameWordmark mode="chain" className="text-2xl" />
        </span>
        <p className="small-caps mt-2 text-[11px] font-bold" style={{ color: modeDef("chain").accent }}>
          {themeFor(date).name}
        </p>
        <p className="small-caps mt-1.5 text-xs text-ink-secondary">
          {formatDisplayDate(date)}
          {!isToday(date) ? " · Archive" : ""} · Game No. {gameNumber}
        </p>

        {/* Hero montage - a fanned peek at today's lineup */}
        <div className="relative mt-6 flex h-44 w-full items-center justify-center sm:h-60">
          {hero.map((card, i) => {
            const offset = i - center;
            return (
              <motion.div
                key={card.id}
                className="absolute h-32 w-24 overflow-hidden rounded-xl bg-surface shadow-xl ring-1 ring-border sm:h-48 sm:w-36"
                style={{ zIndex: hero.length - Math.abs(offset) }}
                initial={{ opacity: 0, y: 24, rotate: offset * 4, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  x: offset * 46,
                  y: Math.abs(offset) * 10,
                  rotate: offset * 8,
                  scale: 1,
                }}
                transition={{ delay: 0.1 + i * 0.07, type: "spring", damping: 18, stiffness: 220 }}
              >
                {card.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-condensed text-2xl font-bold text-ink-secondary">
                    {initialsFor(card.entity_name)}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
            );
          })}
        </div>

        <h1 className="mt-7 text-balance font-condensed text-[2.9rem] font-semibold uppercase leading-[1.02] tracking-wide text-ink sm:text-[3.6rem]">
          {game.topic_label}
        </h1>

        {/* What today's chain is actually comparing - the hook. The admin's
            description says it best when present; otherwise build the question
            straight from the stat so players always know what "higher" means. */}
        <p className="mt-5 max-w-md text-balance text-[15px] leading-relaxed text-ink-secondary sm:text-base">
          {game.description?.trim() ? (
            game.description
          ) : (
            <>
              Two at a time - tap whichever has the higher{" "}
              <span className="font-semibold text-ink">{game.stat_label.toLowerCase()}</span>.
            </>
          )}
        </p>

        {/* rounds */}
        <div className="mt-4">
          <span className="text-sm font-bold text-ink-secondary">{rounds} rounds · higher wins</span>
        </div>

        <Button size="lg" onClick={onStart} className="mt-8 w-full max-w-xs">
          {resuming ? "Resume game" : "Start game"}
        </Button>

      </motion.div>
    </main>
  );
}
