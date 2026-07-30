"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GameBoard } from "./GameBoard";
import { StartScreen } from "./StartScreen";
import { ResultScreen } from "./ResultScreen";
import {
  clearProgress,
  getLocalResult,
  getProgress,
  getSessionId,
  saveLocalResult,
  saveProgress,
  type ProgressSnapshot,
  type StoredResult,
} from "@/lib/playStore";
import { msUntilNextGameMidnight } from "@/lib/date";
import { pointsForGame } from "@/lib/leaderboard";
import { recordChainResult } from "@/lib/recordGame";
import { maxScore } from "@/lib/gameLogic";
import { usePlayedResults } from "@/hooks/usePlayedResults";
import type { GameResultSummary } from "@/hooks/useGame";
import type { FullGame } from "@/types";

interface PlayExperienceProps {
  initialGame: FullGame | null;
  date: string;
  gameNumber: number;
  isDaily: boolean;
}

type Mode = "start" | "playing" | "completed";

export function PlayExperience({
  initialGame,
  date,
  gameNumber,
  isDaily,
}: PlayExperienceProps) {
  const router = useRouter();
  const playable = Boolean(initialGame && initialGame.cards.length >= 2);

  const [mode, setMode] = useState<Mode>("start");
  const [result, setResult] = useState<StoredResult | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [resumeSnap, setResumeSnap] = useState<ProgressSnapshot | null>(null);
  const playedResults = usePlayedResults();

  // On load / whenever the day changes (midnight roll-over): restore a finished
  // result, otherwise pick up any in-progress game so we resume, not restart.
  useEffect(() => {
    const stored = getLocalResult(date);
    if (stored) {
      setResult(stored);
      setAlreadyPlayed(true);
      setResumeSnap(null);
      setMode("completed");
      return;
    }
    const prog = getProgress(date);
    setResumeSnap(prog && prog.roundsPlayed > 0 ? prog : null);
    setResult(null);
    setAlreadyPlayed(false);
    setMode("start");
  }, [date]);

  // Daily game auto-rolls to the next day at midnight (game timezone).
  useEffect(() => {
    if (!isDaily) return;
    const t = setTimeout(() => router.refresh(), msUntilNextGameMidnight() + 1500);
    return () => clearTimeout(t);
  }, [isDaily, date, router]);

  // If this account already finished this date (even on another device), show
  // the saved result instead of offering a replay. Backfills this device's store.
  useEffect(() => {
    if (mode !== "start") return;
    if (getLocalResult(date)) return;
    const sr = playedResults[date];
    if (!sr) return;
    const stored: StoredResult = {
      reached: sr.reached,
      rounds: initialGame ? maxScore(initialGame.cards.length) : sr.rounds,
      wrongRounds: [],
      xpEarned: sr.xpEarned,
      completedAt: new Date().toISOString(),
    };
    saveLocalResult(date, stored);
    setResult(stored);
    setAlreadyPlayed(true);
    setMode("completed");
  }, [playedResults, date, mode, initialGame]);

  const handleComplete = useCallback(
    (summary: GameResultSummary) => {
      // Points for this run, computed on-device so the end screen works
      // offline. The server derives the same number from the recorded row.
      const xpEarned = pointsForGame(summary.reached, summary.rounds);
      // Capture what the share needs while the cards are still in scope: the
      // topic, and the pair that caught them out. Round i compared cards[i]
      // with cards[i + 1], so the first wrong round names its own matchup.
      const cards = initialGame?.cards ?? [];
      const firstWrong = summary.wrongRounds[0];
      const missed =
        typeof firstWrong === "number" && cards[firstWrong] && cards[firstWrong + 1]
          ? ([cards[firstWrong].entity_name, cards[firstWrong + 1].entity_name] as [string, string])
          : undefined;
      const stored: StoredResult = {
        reached: summary.reached,
        rounds: summary.rounds,
        wrongRounds: summary.wrongRounds,
        xpEarned,
        completedAt: new Date().toISOString(),
        topic: initialGame?.topic_label,
        missed,
      };
      saveLocalResult(date, stored);
      clearProgress(date); // game is finished - nothing to resume
      setResult(stored);
      setAlreadyPlayed(false);
      setMode("completed");

      // Record the result + update stats (best-effort; the route is idempotent
      // per session+date). Identity is the anonymous session_id. Fire-and-forget
      // - the end screen doesn't wait on it - but if this run crossed a level
      // the celebration is queued when the response lands.
      recordChainResult({
        session_id: getSessionId(),
        play_date: date,
        reached: summary.reached,
        rounds: summary.rounds,
      });
    },
    [date, initialGame]
  );

  // Tapping the brand mid-game returns to the daily page. On the daily route we
  // reset to the start screen (re-reading saved progress so Resume is offered);
  // from an archived game we navigate to today's game.
  const goToDaily = useCallback(() => {
    if (!isDaily) {
      router.push("/");
      return;
    }
    const prog = getProgress(date);
    setResumeSnap(prog && prog.roundsPlayed > 0 ? prog : null);
    setMode("start");
  }, [isDaily, date, router]);

  if (!playable) {
    return <EmptyState date={date} isDaily={isDaily} />;
  }
  const game = initialGame as FullGame;

  if (mode === "completed" && result) {
    return (
      <ResultScreen
        reached={result.reached}
        rounds={result.rounds}
        wrongRounds={result.wrongRounds}
        date={date}
        mode="play"
        alreadyPlayed={alreadyPlayed}
        cards={game.cards}
        statUnit={game.stat_unit}
      />
    );
  }

  if (mode === "playing") {
    return (
      <GameBoard
        game={game}
        date={date}
        gameNumber={gameNumber}
        onComplete={handleComplete}
        resumeState={resumeSnap}
        onCheckpoint={(snap) => saveProgress(date, snap)}
        onExit={goToDaily}
      />
    );
  }

  return (
    <StartScreen
      game={game}
      date={date}
      gameNumber={gameNumber}
      resuming={Boolean(resumeSnap)}
      onStart={() => setMode("playing")}
    />
  );
}

function EmptyState({ date, isDaily }: { date: string; isDaily: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-game flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-extrabold text-ink">
        {isDaily ? "No game today" : "No game for this day"}
      </h1>
      <p className="text-sm text-ink-secondary">
        {isDaily ? "Check back soon - a new game drops daily." : "This date doesn't have a published game."}
      </p>
      <Link
        href="/archive"
        className="wonky mt-2 border-2 border-ink bg-card px-5 py-2 text-sm font-semibold text-ink"
      >
        Browse the archive
      </Link>
    </main>
  );
}
