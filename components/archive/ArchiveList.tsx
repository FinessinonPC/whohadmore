"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, categoryLabel } from "@/components/ui/Badge";
import { getLocalResult } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { usePlayedResults } from "@/hooks/usePlayedResults";
import { formatShortDate } from "@/lib/date";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };
type PlayedResult = { reached: number; rounds: number; lives: number; total?: number };

function tierClass(reached: number, rounds: number): string {
  if (rounds <= 0) return "border-border bg-surface text-ink-secondary";
  if (reached >= rounds) return "border-correct/30 bg-correct/10 text-correct";
  if (reached >= Math.ceil(rounds * 0.66)) return "border-[#FFB300]/40 bg-[#FFB300]/10 text-[#9A6A00]";
  if (reached >= Math.ceil(rounds * 0.33)) return "border-[#FF7A00]/30 bg-[#FF7A00]/10 text-[#C2590A]";
  return "border-wrong/30 bg-wrong/10 text-wrong";
}

function Hearts({ lives, max = 3 }: { lives: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${lives} lives left`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`text-xs leading-none ${i < lives ? "text-lives" : "text-border"}`}>
          ♥
        </span>
      ))}
    </span>
  );
}

/** Mobile-friendly scrollable list of every game, newest first. */
export function ArchiveList({ games, hrefFor }: { games: NumberedGame[]; hrefFor?: (date: string) => string }) {
  const sorted = useMemo(
    () => [...games].sort((a, b) => (a.play_date < b.play_date ? 1 : -1)),
    [games]
  );
  const serverResults = usePlayedResults();
  const [local, setLocal] = useState<Record<string, PlayedResult>>({});
  useEffect(() => {
    const map: Record<string, PlayedResult> = {};
    for (const g of games) {
      const r = getLocalResult(g.play_date);
      const modes = (["duality", "word", "mini"] as const).reduce(
        (a, m) => a + (getModeResult(m, g.play_date)?.score ?? 0),
        0
      );
      if (r || modes > 0) {
        map[g.play_date] = {
          reached: r?.reached ?? 0,
          rounds: r?.rounds ?? 0,
          lives: r?.lives ?? 0,
          total: (r?.xpEarned ?? 0) + modes,
        };
      }
    }
    setLocal(map);
  }, [games]);
  // Account history (server) merged with anything fresher on this device.
  const played: Record<string, PlayedResult> = useMemo(
    () => ({ ...serverResults, ...local }),
    [serverResults, local]
  );

  if (sorted.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-secondary">
        No games published yet. Check back soon.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {sorted.map((game) => {
        const result = played[game.play_date];
        return (
          <li key={game.id}>
            <Link
              href={hrefFor ? hrefFor(game.play_date) : `/day/${game.play_date}`}
              className="flex items-center gap-3 py-3.5 transition-colors hover:bg-surface"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">
                  <span className="font-condensed text-ink-secondary">No. {game.game_number}</span>
                  <span className="mx-1.5 text-ink-secondary">·</span>
                  {game.topic_label}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-ink-secondary">{formatShortDate(game.play_date)}</span>
                  <Badge tone="category">{categoryLabel(game.topic_category)}</Badge>
                </div>
              </div>
              {result ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Hearts lives={result.lives} />
                  <span
                    className={`rounded-full border px-2.5 py-1 font-condensed text-sm font-semibold tabular ${tierClass(
                      result.reached,
                      result.rounds
                    )}`}
                  >
                    {result.total && result.total > 0
                      ? `${result.total.toLocaleString()} pts`
                      : `${result.reached}/${result.rounds}`}
                  </span>
                </div>
              ) : (
                <span className="shrink-0 rounded-full bg-cta px-4 py-1.5 text-xs font-bold text-background">
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
