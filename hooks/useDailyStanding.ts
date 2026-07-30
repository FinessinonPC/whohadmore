"use client";

import { useEffect, useState } from "react";
import { getLocalResult, getSessionId } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { chainDailyScore, type DailyRow } from "@/lib/leaderboard";
import { LIVE_MODES } from "@/lib/modes";

export interface DailyStanding {
  /** This player's combined score for the day. */
  score: number;
  rank: number;
  total: number;
  /** Share of today's OTHER players this score beat, 0-100. */
  beatPct: number;
}

/**
 * Where today's card puts you against everyone else who has played it.
 *
 * Shared by the card-complete pop-up and the share text so the two can never
 * disagree - a post claiming 67% while the screen behind it says something else
 * is the kind of small wrongness that costs trust.
 *
 * The player's own row is merged in from this device rather than waited for:
 * the result write is fire-and-forget, so the server board usually doesn't know
 * about them yet at the moment they finish.
 */
export function useDailyStanding(date: string): DailyStanding | null {
  const [standing, setStanding] = useState<DailyStanding | null>(null);

  useEffect(() => {
    const chain = getLocalResult(date);
    const chainPts = chain ? chainDailyScore(chain.reached, chain.rounds) : 0;
    const modeSum = LIVE_MODES.filter((m) => m.id !== "chain").reduce(
      (a, m) => a + (getModeResult(m.id, date)?.score ?? 0),
      0
    );
    const score = chainPts + modeSum;

    let cancelled = false;
    const build = (rows: DailyRow[]): DailyStanding => {
      const others = rows.filter((r) => !r.you);
      // Beaten = strictly lower. Ties never count, so the figure can't flatter.
      const beaten = others.filter((r) => r.score < score).length;
      const ahead = others.filter((r) => r.score > score).length;
      return {
        score,
        rank: ahead + 1,
        total: others.length + 1,
        beatPct: others.length > 0 ? Math.round((beaten / others.length) * 100) : 0,
      };
    };

    fetch(`/api/leaderboard/daily?date=${date}&session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { rows?: DailyRow[] }) => {
        if (!cancelled) setStanding(build(d.rows ?? []));
      })
      .catch(() => {
        if (!cancelled) setStanding(build([]));
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  return standing;
}
