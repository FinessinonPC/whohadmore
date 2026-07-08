"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalResult, getSessionId } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { usePlayedResults } from "@/hooks/usePlayedResults";
import { chainDailyScore } from "@/lib/leaderboard";
import { LIVE_MODES, type ModeId } from "@/lib/modes";

export type ArchiveFilter = "all" | ModeId;

export interface DayScore {
  /** Whether the current filter's game(s) were played that day. */
  played: boolean;
  /** Points to show: one game's score, or the combined total for "all". */
  points: number;
  /** How many of the day's games were actually played (for fair "all" tiers). */
  playedGames: number;
}

type ChainInfo = { reached: number; rounds: number };

const QUICK_MODES: ModeId[] = LIVE_MODES.filter((m) => m.id !== "chain").map((m) => m.id);

/**
 * One place to resolve a day's archive score for any filter. Combines Chain
 * (from the account + this device) with the quick games (localStorage + the
 * server), so the calendar and list agree and work cross-device. Returns a
 * lookup: scoreFor(date, filter).
 */
export function useArchiveScores(games: { play_date: string }[]) {
  const serverChain = usePlayedResults();
  const [localChain, setLocalChain] = useState<Record<string, ChainInfo>>({});
  const [localModes, setLocalModes] = useState<Record<string, Record<string, number>>>({});
  const [serverModes, setServerModes] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    const chain: Record<string, ChainInfo> = {};
    const modes: Record<string, Record<string, number>> = {};
    for (const g of games) {
      const r = getLocalResult(g.play_date);
      if (r) chain[g.play_date] = { reached: r.reached, rounds: r.rounds };
      for (const m of QUICK_MODES) {
        const res = getModeResult(m, g.play_date);
        if (res) (modes[g.play_date] ??= {})[m] = res.score;
      }
    }
    setLocalChain(chain);
    setLocalModes(modes);
  }, [games]);

  useEffect(() => {
    fetch(`/api/modes/results?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { results?: Record<string, Record<string, number>> }) =>
        setServerModes(d.results ?? {})
      )
      .catch(() => setServerModes({}));
  }, []);

  return useMemo(() => {
    return (date: string, filter: ArchiveFilter): DayScore => {
      const chain = localChain[date] ?? serverChain[date] ?? null;
      const chainPts = chain ? chainDailyScore(chain.reached, chain.rounds) : 0;
      const chainPlayed = Boolean(chain);

      const modes: Record<string, number> = { ...serverModes[date], ...localModes[date] };
      const modePlayed = (m: string) => m in modes;
      const modePts = (m: string) => modes[m] ?? 0;

      if (filter === "chain") {
        return { played: chainPlayed, points: chainPts, playedGames: chainPlayed ? 1 : 0 };
      }
      if (filter !== "all") {
        return {
          played: modePlayed(filter),
          points: modePts(filter),
          playedGames: modePlayed(filter) ? 1 : 0,
        };
      }
      const playedGames = (chainPlayed ? 1 : 0) + QUICK_MODES.filter(modePlayed).length;
      const points = chainPts + QUICK_MODES.reduce((a, m) => a + modePts(m), 0);
      return { played: playedGames > 0, points, playedGames };
    };
  }, [localChain, serverChain, localModes, serverModes]);
}
