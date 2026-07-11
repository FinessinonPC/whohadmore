"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useArchiveScores, type ArchiveFilter } from "@/hooks/useArchiveScores";
import { formatShortDate } from "@/lib/date";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };

/** Mobile-friendly scrollable list of every game, newest first. No performance
 *  grading - played days show their score, and days you haven't played invite a
 *  tap (which nudges sign-in for past days). */
export function ArchiveList({
  games,
  hrefFor,
  filter = "all",
}: {
  games: NumberedGame[];
  hrefFor?: (date: string) => string;
  filter?: ArchiveFilter;
}) {
  const scoreFor = useArchiveScores(games);
  const sorted = useMemo(
    () => [...games].sort((a, b) => (a.play_date < b.play_date ? 1 : -1)),
    [games]
  );

  if (sorted.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-secondary">
        No games published yet. Check back soon.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((game) => {
        const score = scoreFor(game.play_date, filter);
        return (
          <li key={game.id}>
            <Link
              href={hrefFor ? hrefFor(game.play_date) : `/day/${game.play_date}`}
              className="card-ink flex items-center gap-3 px-4 py-3.5 transition-transform hover:-translate-y-0.5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-condensed text-lg font-bold text-ink">
                  No. {game.game_number}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink-secondary">
                  {formatShortDate(game.play_date)}
                </p>
              </div>
              {score.played ? (
                <span className="marker-gold shrink-0 font-condensed text-base font-semibold tabular text-ink">
                  {score.points.toLocaleString()} pts
                </span>
              ) : (
                <span className="blank-box flex h-[30px] shrink-0 items-center px-3.5 text-[10px] font-bold uppercase tracking-[0.08em]">
                  Play
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
