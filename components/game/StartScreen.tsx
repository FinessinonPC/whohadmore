"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge, categoryLabel } from "@/components/ui/Badge";
import { BrandMark } from "@/components/ui/Logo";
import { STARTING_LIVES, maxScore } from "@/lib/gameLogic";
import { formatDisplayDate, isToday } from "@/lib/date";
import type { FullGame } from "@/types";

interface StartScreenProps {
  game: FullGame;
  date: string;
  gameNumber: number;
  onStart: () => void;
}

export function StartScreen({ game, date, gameNumber, onStart }: StartScreenProps) {
  const rounds = maxScore(game.cards.length);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5">
      <TopBar />

      <motion.div
        className="flex flex-1 flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 16, stiffness: 220, delay: 0.05 }}
        >
          <BrandMark className="h-20 w-20 drop-shadow-sm" />
        </motion.div>

        <p className="mt-7 small-caps text-xs text-ink-secondary">
          {formatDisplayDate(date)}
          {!isToday(date) ? " · Archive" : ""}
        </p>
        <p className="mt-1 small-caps text-[11px] text-ink-secondary">
          Game No. {gameNumber}
        </p>

        <h1 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink">
          {game.topic_label}
        </h1>

        <div className="mt-4 flex items-center gap-2">
          <Badge tone="category">{categoryLabel(game.topic_category)}</Badge>
          <Badge tone="neutral">{game.stat_label}</Badge>
        </div>

        <p className="mt-8 max-w-xs text-balance text-[15px] leading-relaxed text-ink-secondary">
          Two cards, one stat. Tap whichever had{" "}
          <span className="font-semibold text-ink">more {game.stat_unit || game.stat_label}</span>.
          {" "}
          {STARTING_LIVES} lives, {rounds} rounds.
        </p>

        <Button size="lg" onClick={onStart} className="mt-10 w-full max-w-xs">
          Start game
        </Button>
      </motion.div>
    </main>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between">
      <Link href="/" className="inline-flex items-center gap-1.5">
        <BrandMark className="h-5 w-5" />
        <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
      </Link>
      <Link
        href="/archive"
        className="text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
      >
        Archive
      </Link>
    </header>
  );
}
