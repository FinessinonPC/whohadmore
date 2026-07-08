"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, categoryLabel } from "@/components/ui/Badge";
import { getLocalResult, getSessionId } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { usePlayedResults } from "@/hooks/usePlayedResults";
import { chainDailyScore } from "@/lib/leaderboard";
import { formatShortDate } from "@/lib/date";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };
type ChainInfo = { reached: number; rounds: number; lives: number };

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
  // Chain history: server (cross-device) merged with anything fresher on this
  // device. Quick-game points come from localStorage AND the server, so the
  // total covers every game even for days played on another device.
  const serverChain = usePlayedResults();
  const [localChain, setLocalChain] = useState<Record<string, ChainInfo>>({});
  const [localModes, setLocalModes] = useState<Record<string, number>>({});
  const [serverModes, setServerModes] = useState<Record<string, number>>({});

  useEffect(() => {
    const chain: Record<string, ChainInfo> = {};
    const modes: Record<string, number> = {};
    for (const g of games) {
      const r = getLocalResult(g.play_date);
      if (r) chain[g.play_date] = { reached: r.reached, rounds: r.rounds, lives: r.lives };
      const m = (["duality", "word", "mini"] as const).reduce(
        (a, mode) => a + (getModeResult(mode, g.play_date)?.score ?? 0),
        0
      );
      if (m > 0) modes[g.play_date] = m;
    }
    setLocalChain(chain);
    setLocalModes(modes);
  }, [games]);

  useEffect(() => {
    fetch(`/api/modes/results?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { results?: Record<string, number> }) => setServerModes(d.results ?? {}))
      .catch(() => setServerModes({}));
  }, []);

  // One combined figure per date: Chain's daily points + every quick game.
  const infoFor = useMemo(() => {
    return (date: string) => {
      const chain = localChain[date] ?? serverChain[date] ?? null;
      const chainPts = chain ? chainDailyScore(chain.reached, chain.rounds, chain.lives) : 0;
      const modePts = localModes[date] ?? serverModes[date] ?? 0;
      return {
        played: Boolean(chain) || modePts > 0,
        total: chainPts + modePts,
        reached: chain?.reached ?? 0,
        rounds: chain?.rounds ?? 0,
        lives: chain?.lives ?? 0,
      };
    };
  }, [localChain, localModes, serverChain, serverModes]);

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
        const info = infoFor(game.play_date);
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
              {info.played ? (
                <div className="flex shrink-0 items-center gap-2">
                  {info.lives > 0 && <Hearts lives={info.lives} />}
                  <span
                    className={`rounded-full border px-2.5 py-1 font-condensed text-sm font-semibold tabular ${tierClass(
                      info.reached,
                      info.rounds
                    )}`}
                  >
                    {info.total.toLocaleString()} pts
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
