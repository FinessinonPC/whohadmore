"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPairAt,
  isCorrectGuess,
  isLastPair,
  maxScore,
  STARTING_LIVES,
  type ActivePair,
  type Side,
} from "@/lib/gameLogic";
import type { GameCard } from "@/types";

// Timings (ms) — tuned so the count-up fully lands before we move on.
const REVEAL_HOLD = 950; // pause on a correct reveal before sliding
const SLIDE_DURATION = 480; // matches the CardPair slide transition
const WRONG_HOLD = 1150; // pause after a wrong guess before retrying

export type GamePhase =
  | "idle"
  | "reveal-correct"
  | "reveal-wrong"
  | "transitioning"
  | "complete";

export interface GameResultSummary {
  score: number;
  best: number;
  lives: number;
  timeSeconds: number;
}

interface UseGameOptions {
  onComplete?: (result: GameResultSummary) => void;
}

export interface UseGameState {
  cards: GameCard[];
  currentIndex: number;
  lives: number;
  score: number;
  phase: GamePhase;
  chosenSide: Side | null;
  pair: ActivePair | null;
  total: number;
  best: number;
  /** Right card reveals its value during a correct reveal. */
  revealRight: boolean;
  elapsedSeconds: number;
  guess: (side: Side) => void;
  restart: () => void;
}

export function useGame(cards: GameCard[], opts: UseGameOptions = {}): UseGameState {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [chosenSide, setChosenSide] = useState<Side | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Pending timers, cleared on unmount / restart so callbacks never fire late.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAt = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // Keep the latest onComplete without re-arming effects.
  const onCompleteRef = useRef(opts.onComplete);
  useEffect(() => {
    onCompleteRef.current = opts.onComplete;
  });

  const total = cards.length;
  const best = maxScore(total);
  const pair = useMemo(() => getPairAt(cards, currentIndex), [cards, currentIndex]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const guess = useCallback(
    (side: Side) => {
      if (phase !== "idle" || !pair) return;

      const correct = isCorrectGuess(
        side,
        pair.left.stat_value,
        pair.right.stat_value
      );
      setChosenSide(side);

      if (correct) {
        // Reveal the right card (count-up), hold, then slide the chain forward.
        setPhase("reveal-correct");
        schedule(() => {
          setScore((s) => s + 1);
          if (isLastPair(currentIndex, total)) {
            setPhase("complete");
            return;
          }
          // Advancing the index drives the slide: old left exits, old right
          // (now revealed) moves into the left slot, a fresh hidden right enters.
          setCurrentIndex((i) => i + 1);
          setPhase("transitioning");
          schedule(() => {
            setChosenSide(null);
            setPhase("idle");
          }, SLIDE_DURATION);
        }, REVEAL_HOLD);
      } else {
        setPhase("reveal-wrong");
        const remaining = lives - 1;
        setLives(remaining);
        schedule(() => {
          if (remaining <= 0) {
            setPhase("complete");
          } else {
            // Same pair — value stays hidden so the reveal still pays off.
            setChosenSide(null);
            setPhase("idle");
          }
        }, WRONG_HOLD);
      }
    },
    [phase, pair, currentIndex, total, lives, schedule]
  );

  const restart = useCallback(() => {
    clearTimers();
    completedRef.current = false;
    startedAt.current = Date.now();
    setCurrentIndex(0);
    setLives(STARTING_LIVES);
    setScore(0);
    setChosenSide(null);
    setPhase("idle");
    setElapsedSeconds(0);
  }, [clearTimers]);

  // Freeze the clock and emit the result the moment the game completes (once).
  useEffect(() => {
    if (phase !== "complete" || completedRef.current) return;
    completedRef.current = true;
    const seconds = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
    setElapsedSeconds(seconds);
    onCompleteRef.current?.({ score, best, lives, timeSeconds: seconds });
  }, [phase, score, best, lives]);

  // Only the pair being judged reveals its right value. Once the index
  // advances (transitioning), the incoming right card stays hidden.
  const revealRight = phase === "reveal-correct";

  return {
    cards,
    currentIndex,
    lives,
    score,
    phase,
    chosenSide,
    pair,
    total,
    best,
    revealRight,
    elapsedSeconds,
    guess,
    restart,
  };
}
