"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TopNav } from "@/components/ui/TopNav";
import { initialsFor } from "@/lib/wikimedia";
import { STARTING_LIVES, maxScore } from "@/lib/gameLogic";
import { formatDisplayDate, isToday } from "@/lib/date";
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
  const rounds = maxScore(game.cards.length);
  const hero = pickSpread(game.cards, 5);
  const center = (hero.length - 1) / 2;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5 sm:max-w-2xl">
      <TopNav />

      <motion.div
        className="flex flex-1 flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="small-caps text-xs text-ink-secondary">
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
                className="absolute h-32 w-24 overflow-hidden rounded-lg border-2 border-white bg-ink shadow-xl sm:h-48 sm:w-36"
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
                  <div className="flex h-full w-full items-center justify-center font-condensed text-2xl font-bold text-white/80">
                    {initialsFor(card.entity_name)}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
            );
          })}
        </div>

        <h1 className="mt-7 text-balance text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[3.25rem]">
          {game.topic_label}
        </h1>

        <p className="mt-5 max-w-sm text-balance text-[15px] leading-relaxed text-ink-secondary sm:text-base">
          Two cards, one stat - tap{" "}
          <span className="font-semibold text-ink">whichever is higher</span>.
        </p>

        {/* lives + rounds */}
        <div className="mt-5 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-3xl leading-none text-lives">
            {Array.from({ length: STARTING_LIVES }).map((_, i) => (
              <span key={i}>♥</span>
            ))}
          </span>
          <span className="text-sm font-bold text-ink-secondary">{rounds} rounds</span>
        </div>

        <Button size="lg" onClick={onStart} className="mt-8 w-full max-w-xs">
          {resuming ? "Resume game" : "Start game"}
        </Button>
        <p className="mt-3 text-xs text-ink-secondary">
          {resuming ? "Pick up where you left off." : "A fresh game every day"}
        </p>
        <Link
          href="/about"
          className="mt-4 text-xs font-semibold text-ink-secondary underline underline-offset-2 transition-colors hover:text-ink"
        >
          What is WhoHadMore?
        </Link>
      </motion.div>
    </main>
  );
}
