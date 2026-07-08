"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPairAt,
  isCorrectGuess,
  isLastPair,
  maxScore,
  type ActivePair,
  type Side,
} from "@/lib/gameLogic";
import type { GameCard } from "@/types";

// Timings (ms). The count-up runs first with NO verdict (suspense); only after
// it lands do we reveal correct/wrong.
const COUNT_DURATION = 1900; // ~1.4s count-up + a ~0.5s suspense beat before the verdict
const VERDICT_HOLD = 800; // correct: snappy move-on
const WRONG_HOLD = 1000; // wrong: a brief beat, then move on (no lives to mourn)
const SLIDE_DURATION = 480; // matches the CardPair slide transition

export type GamePhase =
  | "idle"
  | "counting"
  | "reveal-correct"
  | "reveal-wrong"
  | "transitioning"
  | "complete";

export interface GameResultSummary {
  /** How many the player got right (0..rounds). Drives the score. */
  reached: number;
  rounds: number; // total rounds (= best)
  wrongRounds: number[];
}

export interface GameCheckpoint {
  currentIndex: number;
  score: number;
  wrongRounds: number[];
  roundsPlayed: number;
  elapsedSeconds: number;
}

interface UseGameOptions {
  onComplete?: (result: GameResultSummary) => void;
  /** Seed state to resume an in-progress game. */
  initial?: GameCheckpoint | null;
  /** Fired at each stable pair boundary so progress can be persisted. */
  onCheckpoint?: (snap: GameCheckpoint) => void;
}

export interface UseGameState {
  cards: GameCard[];
  currentIndex: number;
  score: number; // number correct so far
  phase: GamePhase;
  chosenSide: Side | null;
  pair: ActivePair | null;
  total: number;
  best: number;
  /** Right card reveals its value during a correct reveal. */
  revealRight: boolean;
  /** Round indices (0-based pairs) the player got wrong - for the timeline. */
  wrongRounds: number[];
  guess: (side: Side) => void;
  restart: () => void;
}

/**
 * Chain, no lives: the player answers every round and the score is simply how
 * many they got right. A wrong call no longer ends the run - it just doesn't
 * count. The game finishes at the last pair.
 */
export function useGame(cards: GameCard[], opts: UseGameOptions = {}): UseGameState {
  const init = opts.initial ?? null;
  const [currentIndex, setCurrentIndex] = useState(init?.currentIndex ?? 0);
  const [score, setScore] = useState(init?.score ?? 0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [chosenSide, setChosenSide] = useState<Side | null>(null);
  const [wrongRounds, setWrongRounds] = useState<number[]>(init?.wrongRounds ?? []);

  // Pending timers, cleared on unmount / restart so callbacks never fire late.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Resume keeps the clock running from where it left off (used only for the
  // resume checkpoint - Chain's score has no time component).
  const startedAt = useRef<number>(Date.now() - (init?.elapsedSeconds ?? 0) * 1000);
  const completedRef = useRef(false);
  // Refs mirror state so the completion summary reads current values.
  const roundsPlayedRef = useRef(init?.roundsPlayed ?? 0);
  const correctRef = useRef(init?.score ?? 0);
  const wrongRoundsRef = useRef<number[]>(init?.wrongRounds ?? []);

  // Keep latest callbacks without re-arming effects.
  const onCompleteRef = useRef(opts.onComplete);
  const onCheckpointRef = useRef(opts.onCheckpoint);
  useEffect(() => {
    onCompleteRef.current = opts.onComplete;
    onCheckpointRef.current = opts.onCheckpoint;
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

      const correct = isCorrectGuess(side, pair.left.stat_value, pair.right.stat_value);
      const idx = currentIndex;
      roundsPlayedRef.current += 1;

      setChosenSide(side);
      // 1) Count the value up with no verdict yet - pure suspense.
      setPhase("counting");

      schedule(() => {
        // 2) The number has landed; now show the verdict.
        setPhase(correct ? "reveal-correct" : "reveal-wrong");
        if (correct) {
          correctRef.current += 1;
          setScore((s) => s + 1);
        } else {
          wrongRoundsRef.current = [...wrongRoundsRef.current, idx];
          setWrongRounds(wrongRoundsRef.current);
        }

        schedule(() => {
          // 3) End at the last pair; otherwise slide on. Wrong answers no longer
          //    end the run - the player always plays the whole chain.
          if (isLastPair(idx, total)) {
            setPhase("complete");
            return;
          }
          setCurrentIndex((i) => i + 1);
          setPhase("transitioning");
          schedule(() => {
            setChosenSide(null);
            setPhase("idle");
          }, SLIDE_DURATION);
        }, correct ? VERDICT_HOLD : WRONG_HOLD);
      }, COUNT_DURATION);
    },
    [phase, pair, currentIndex, total, schedule]
  );

  const restart = useCallback(() => {
    clearTimers();
    completedRef.current = false;
    startedAt.current = Date.now();
    roundsPlayedRef.current = 0;
    correctRef.current = 0;
    wrongRoundsRef.current = [];
    setCurrentIndex(0);
    setScore(0);
    setChosenSide(null);
    setPhase("idle");
    setWrongRounds([]);
  }, [clearTimers]);

  // Emit the result the moment the game completes (once).
  useEffect(() => {
    if (phase !== "complete" || completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.({
      reached: correctRef.current,
      rounds: best,
      wrongRounds: wrongRoundsRef.current,
    });
  }, [phase, best]);

  // Persist a checkpoint at each stable pair boundary so leaving mid-game can
  // resume rather than restart.
  useEffect(() => {
    if (phase !== "idle" || completedRef.current) return;
    onCheckpointRef.current?.({
      currentIndex,
      score,
      wrongRounds: wrongRoundsRef.current,
      roundsPlayed: roundsPlayedRef.current,
      elapsedSeconds: Math.max(0, Math.round((Date.now() - startedAt.current) / 1000)),
    });
  }, [phase, currentIndex, score]);

  // The right value is visible while it counts up and through the verdict. Once
  // the index advances (transitioning), the incoming right card stays hidden.
  const revealRight =
    phase === "counting" || phase === "reveal-correct" || phase === "reveal-wrong";

  return {
    cards,
    currentIndex,
    score,
    phase,
    chosenSide,
    pair,
    total,
    best,
    revealRight,
    wrongRounds,
    guess,
    restart,
  };
}
