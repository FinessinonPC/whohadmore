"use client";

import Link from "next/link";
import { GameBoard } from "./GameBoard";
import { useDailyGame } from "@/hooks/useDailyGame";
import { formatDisplayDate } from "@/lib/date";

interface GameScreenProps {
  date: string;
  isArchive: boolean;
}

/** Handles fetching + loading / empty states, then hands off to GameBoard. */
export function GameScreen({ date, isArchive }: GameScreenProps) {
  const { game, loading, error } = useDailyGame(date);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-game flex-col items-center justify-center gap-3 px-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
        <p className="text-sm text-ink-secondary">Loading today&apos;s game…</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Something went wrong"
        body={error}
      />
    );
  }

  if (!game || game.cards.length < 2) {
    return (
      <EmptyState
        title="No game for this day"
        body={`There's no published game for ${formatDisplayDate(date)} yet.`}
      />
    );
  }

  return <GameBoard game={game} isArchive={isArchive} />;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-game flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-extrabold text-ink">{title}</h1>
      <p className="text-sm text-ink-secondary">{body}</p>
      <Link
        href="/archive"
        className="mt-2 rounded-full border border-border bg-surface px-5 py-2 text-sm font-semibold text-ink"
      >
        Browse the archive
      </Link>
    </div>
  );
}
