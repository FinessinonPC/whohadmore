"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { CardPair } from "./CardPair";
import { ChainTimeline } from "./ChainTimeline";
import { BrandLockup } from "@/components/ui/Logo";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import {
  useGame,
  type GameCheckpoint,
  type GamePhase,
  type GameResultSummary,
} from "@/hooks/useGame";
import { avoidAdjacentTies } from "@/lib/gameLogic";
import { hashSeed, mulberry32, seededShuffle } from "@/lib/seed";
import { getSessionId } from "@/lib/playStore";
import { formatShortDate } from "@/lib/date";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "./Fireworks";
import type { FullGame } from "@/types";

interface GameBoardProps {
  game: FullGame;
  date: string;
  gameNumber: number;
  onComplete: (result: GameResultSummary) => void;
  /** Resume an in-progress game from a saved checkpoint. */
  resumeState?: GameCheckpoint | null;
  onCheckpoint?: (snap: GameCheckpoint) => void;
  /** Embedded in the admin preview - hide site nav so nothing navigates away. */
  embedded?: boolean;
  /** Tap-the-brand handler. On the daily route this returns to the start screen
   *  (saved progress lets the player resume); from an archived game it goes to
   *  today's game. Falls back to a plain link home when omitted. */
  onExit?: () => void;
}

function hintFor(phase: GamePhase): { text: string; tone: string } {
  switch (phase) {
    case "reveal-correct":
      return { text: "Correct", tone: "text-correct" };
    case "reveal-wrong":
      return { text: "Wrong", tone: "text-wrong" };
    case "idle":
      return { text: "Tap whichever is higher", tone: "text-ink-secondary" };
    default:
      return { text: "", tone: "text-ink-secondary" };
  }
}

export function GameBoard({
  game,
  date,
  gameNumber,
  onComplete,
  resumeState = null,
  onCheckpoint,
  embedded = false,
  onExit,
}: GameBoardProps) {
  // Random-but-stable card order: unique per player (session) and per day, yet
  // reproducible so a resumed game keeps the same order.
  // Cap the run at 11 cards = 10 decisions, whatever the admin published.
  const cards = useMemo(
    () =>
      avoidAdjacentTies(
        seededShuffle(game.cards, mulberry32(hashSeed(`${getSessionId()}:${date}`))).slice(0, 11)
      ),
    [game, date]
  );

  const state = useGame(cards, { onComplete, initial: resumeState, onCheckpoint });

  // Preload every card image so slides reveal instantly instead of popping in.
  useEffect(() => {
    cards.forEach((c) => {
      if (c.image_url) {
        const img = new window.Image();
        img.src = c.image_url;
      }
    });
  }, [cards]);

  // Sound + haptics on each reveal.
  useEffect(() => {
    if (state.phase === "reveal-correct") feedbackCorrect();
    else if (state.phase === "reveal-wrong") feedbackWrong();
  }, [state.phase]);

  // Keyboard controls (desktop): ←/A/1 = left, →/D/2 = right.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.phase !== "idle") return;
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a" || k === "1") {
        e.preventDefault();
        state.guess("left");
      } else if (k === "arrowright" || k === "d" || k === "2") {
        e.preventDefault();
        state.guess("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, state.guess]);

  // Bottom bar tracks position through the chain (not score).
  const rounds = Math.max(1, state.total - 1);
  const roundsDone = state.phase === "complete" ? rounds : state.currentIndex;

  const hint = hintFor(state.phase);

  return (
    <>
      {isJuly4th(date) && <Fireworks />}

      <main className="relative z-[46] mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden px-4 pb-5 pt-5 md:max-w-[880px] lg:max-w-[1120px]">
        {/* Header - kept minimal during play. The brand returns to the daily
            page; saved progress lets the player resume. */}
        <header className="flex shrink-0 items-center justify-between">
          {embedded ? (
            <span className="text-sm font-extrabold tracking-tight text-ink">Preview</span>
          ) : onExit ? (
            <button onClick={onExit} aria-label="Back to today's game">
              <BrandLockup />
            </button>
          ) : (
            <Link href="/" aria-label="Back to today's game">
              <BrandLockup />
            </Link>
          )}
          {/* Running tally of correct calls - this is the score now. */}
          <span className="flex items-center gap-1.5 font-condensed text-lg font-semibold text-ink">
            <span className="text-correct">✓</span>
            <span className="tabular">
              {state.score}
              <span className="text-ink-secondary"> / {rounds}</span>
            </span>
          </span>
        </header>

        {/* What's being compared - always visible, even mid-game, so a player
            who skipped the start screen still knows what "higher" means. The
            date/number metadata stays tablet/desktop-only. */}
        <div className="mt-3 shrink-0 text-center">
          <p className="hidden small-caps text-[11px] text-ink-secondary md:block">
            {formatShortDate(date)} · {embedded ? "Preview" : `Game No. ${gameNumber}`}
          </p>
          <p className="text-[13px] font-semibold text-ink-secondary md:mt-1">
            {game.stat_label}
            {game.stat_unit ? ` (${game.stat_unit})` : ""}
          </p>
        </div>

        {/* The two cards - fill all remaining space */}
        <div className="relative flex min-h-0 flex-1 flex-col py-4">
          {state.pair && (
            <CardPair
              pair={state.pair}
              statUnit={game.stat_unit}
              phase={state.phase}
              chosenSide={state.chosenSide}
              revealRight={state.revealRight}
              onGuess={state.guess}
            />
          )}
        </div>

        {/* Status / hint line */}
        <div className="flex h-7 shrink-0 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={hint.text}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className={`text-sm font-bold uppercase tracking-wide ${hint.tone}`}
            >
              {hint.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Lesson-style progress timeline */}
        <ChainTimeline position={roundsDone} total={rounds} wrongRounds={state.wrongRounds} />
      </main>
    </>
  );
}
