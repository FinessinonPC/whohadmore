"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GameBoard } from "./GameBoard";
import { StartScreen } from "./StartScreen";
import { ResultScreen } from "./ResultScreen";
import {
  clearLocalResult,
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
import { levelFromXp, pointsForGame, type Profile } from "@/lib/leaderboard";
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
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [creditedXp, setCreditedXp] = useState<number | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [resumeSnap, setResumeSnap] = useState<ProgressSnapshot | null>(null);
  const playedResults = usePlayedResults();

  // On load / whenever the day changes (midnight roll-over): restore a finished
  // result, otherwise pick up any in-progress game so we resume, not restart.
  useEffect(() => {
    setLevelUp(null);
    setStreak(null);
    setCreditedXp(null);
    setNewAchievements([]);
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
      lives: sr.lives,
      timeSeconds: sr.timeSeconds,
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
      // XP shown is the streak-free baseline (instant + works offline). The
      // leaderboard total credits the streak multiplier server-side.
      const xpEarned = pointsForGame(summary.reached, summary.rounds, summary.timeSeconds, 0);
      const stored: StoredResult = {
        reached: summary.reached,
        rounds: summary.rounds,
        lives: summary.lives,
        timeSeconds: summary.timeSeconds,
        wrongRounds: summary.wrongRounds,
        xpEarned,
        completedAt: new Date().toISOString(),
      };
      saveLocalResult(date, stored);
      clearProgress(date); // game is finished — nothing to resume
      setResult(stored);
      setAlreadyPlayed(false);
      setLevelUp(null);
      setStreak(null);
      setCreditedXp(null);
      setNewAchievements([]);
      setMode("completed");

      // Record the result + update leaderboard stats (best-effort; the route is
      // idempotent per session+date). Identity is the anonymous session_id.
      // A returned profile means they were signed in before this game, so we can
      // detect whether this run pushed them up a level.
      void fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: getSessionId(),
          play_date: date,
          reached: summary.reached,
          rounds: summary.rounds,
          lives: summary.lives,
          time_seconds: summary.timeSeconds,
        }),
      })
        .then((r) => r.json())
        .then(
          (data: {
            profile: Profile | null;
            pointsEarned?: number;
            newAchievements?: string[];
          }) => {
            if (data.newAchievements?.length) setNewAchievements(data.newAchievements);
            if (data.profile && typeof data.pointsEarned === "number") {
              const after = levelFromXp(data.profile.xp);
              const before = levelFromXp(data.profile.xp - data.pointsEarned);
              if (after > before) setLevelUp(after);
              // Streak (shown as a stat) and the actual credited XP (streak included).
              setStreak(data.profile.current_streak);
              if (data.pointsEarned > 0) setCreditedXp(data.pointsEarned);
            }
          }
        )
        .catch(() => {
          /* never block the end screen on result tracking */
        });
    },
    [date]
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

  // Testing-only: wipe this date's saved result and return to the start screen.
  // Remove the onReset prop (and the button) before the public launch.
  const resetForTesting = () => {
    clearLocalResult(date);
    clearProgress(date);
    setResult(null);
    setAlreadyPlayed(false);
    setLevelUp(null);
    setStreak(null);
    setCreditedXp(null);
    setNewAchievements([]);
    setResumeSnap(null);
    setMode("start");
  };

  if (mode === "completed" && result) {
    return (
      <ResultScreen
        reached={result.reached}
        rounds={result.rounds}
        lives={result.lives}
        timeSeconds={result.timeSeconds}
        wrongRounds={result.wrongRounds}
        xpEarned={creditedXp ?? result.xpEarned}
        topicLabel={game.topic_label}
        date={date}
        gameNumber={gameNumber}
        mode="play"
        alreadyPlayed={alreadyPlayed}
        levelUp={levelUp}
        streak={streak}
        newAchievements={newAchievements}
        onReset={resetForTesting}
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
        {isDaily ? "Check back soon — a new game drops daily." : "This date doesn't have a published game."}
      </p>
      <Link
        href="/archive"
        className="mt-2 rounded-full border border-border bg-surface px-5 py-2 text-sm font-semibold text-ink"
      >
        Browse the archive
      </Link>
    </main>
  );
}
