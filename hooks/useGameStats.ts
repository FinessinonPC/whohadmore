"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllLocalResults, getSessionId } from "@/lib/playStore";
import { getAllModeResults, type ModeResult } from "@/lib/modeStore";
import { usePlayedResults } from "@/hooks/usePlayedResults";
import { chainDailyScore } from "@/lib/leaderboard";
import { DUALITY_PAIRS, WORD_MAX_GUESSES, WORD_POINTS } from "@/lib/modes";
import type { ModeRow } from "@/app/api/modes/stats/route";

// ============================================================================
// Per-game lifetime stats for the profile. One merged view over three sources:
//  1. Server rows (cross-device truth; detail columns exist from migration 0007)
//  2. This device's local saves (often richer for days recorded pre-migration)
//  3. Legacy inference where the math is airtight (a Word score maps 1:1 to
//     the winning guess count; a loss always scores 0)
// Averages only count games where the underlying fact is actually known - a
// day with an unknown solve time never drags an average toward zero.
// ============================================================================

export interface ChainStats {
  played: number;
  avgCorrect: number | null; // mean correct calls per game
  avgRounds: number | null; // mean round count (for the "of N" label)
  perfect: number; // full clears
  avgPoints: number | null;
  best: number;
}

export interface DualityStats {
  played: number;
  solveRate: number | null; // share of known outcomes that found all pairs
  perfect: number; // solved with zero mistakes
  avgMistakes: number | null;
  avgPoints: number | null;
  best: number;
}

export interface WordStats {
  played: number;
  winRate: number | null;
  avgGuesses: number | null; // over wins only, the Wordle convention
  dist: number[]; // dist[i] = wins in i+1 guesses
  avgPoints: number | null;
  best: number;
}

export interface MiniStats {
  played: number;
  avgSeconds: number | null;
  bestSeconds: number | null;
  clean: number; // solved without a single Check
  avgPoints: number | null;
  best: number;
}

export interface GameStatsData {
  chain: ChainStats;
  duality: DualityStats;
  word: WordStats;
  mini: MiniStats;
  loading: boolean;
}

/** One quick-game day after merging server + local + inference. */
interface MergedDay {
  score: number;
  seconds: number | null;
  moves: number | null;
  won: boolean | null;
}

const avg = (sum: number, n: number): number | null => (n > 0 ? sum / n : null);

/** Word only: the score → guesses map is exact (1000→1 … 500→6, loss→0). */
function wordGuessesFromScore(score: number): number | null {
  const i = WORD_POINTS.indexOf(score);
  return i >= 0 ? i + 1 : null;
}

function mergeMode(
  mode: "duality" | "word" | "mini",
  server: ModeRow[],
  local: Record<string, ModeResult>
): Record<string, MergedDay> {
  const days: Record<string, MergedDay> = {};
  for (const r of server) {
    if (r.mode !== mode || !r.play_date) continue;
    days[r.play_date] = { score: r.score, seconds: r.seconds, moves: r.moves, won: r.won };
  }
  for (const [date, l] of Object.entries(local)) {
    const d = (days[date] ??= { score: l.score, seconds: null, moves: null, won: null });
    // Local typed fields fill whatever the server row is missing.
    d.seconds ??= typeof l.seconds === "number" ? l.seconds : null;
    d.moves ??= typeof l.moves === "number" ? l.moves : null;
    d.won ??= typeof l.won === "boolean" ? l.won : null;
    // Legacy local saves: recover what the old detail arrays encoded.
    if (mode === "word") {
      d.moves ??= typeof l.detail?.[0] === "number" ? l.detail[0] : null;
    } else if (mode === "duality") {
      d.moves ??= typeof l.detail?.[1] === "number" ? l.detail[1] : null;
      d.won ??= typeof l.detail?.[0] === "number" ? l.detail[0] >= DUALITY_PAIRS : null;
    } else {
      d.moves ??= typeof l.detail?.[0] === "number" ? l.detail[0] : null;
    }
  }
  // Word: a winning score is always one of WORD_POINTS, and a loss pays
  // partial credit capped well below the worst win (5 greens x 40 = 200 < 500)
  // - so the score alone settles won/guesses for any still-unknown day.
  if (mode === "word") {
    for (const d of Object.values(days)) {
      d.won ??= WORD_POINTS.includes(d.score);
      if (d.won && d.moves === null) d.moves = wordGuessesFromScore(d.score);
    }
  }
  return days;
}

const EMPTY: GameStatsData = {
  chain: { played: 0, avgCorrect: null, avgRounds: null, perfect: 0, avgPoints: null, best: 0 },
  duality: { played: 0, solveRate: null, perfect: 0, avgMistakes: null, avgPoints: null, best: 0 },
  word: { played: 0, winRate: null, avgGuesses: null, dist: Array(WORD_MAX_GUESSES).fill(0), avgPoints: null, best: 0 },
  mini: { played: 0, avgSeconds: null, bestSeconds: null, clean: 0, avgPoints: null, best: 0 },
  loading: true,
};

export function useGameStats(): GameStatsData {
  const serverChain = usePlayedResults();
  const [serverRows, setServerRows] = useState<ModeRow[] | null>(null);
  const [local, setLocal] = useState<{
    chain: ReturnType<typeof getAllLocalResults>;
    duality: Record<string, ModeResult>;
    word: Record<string, ModeResult>;
    mini: Record<string, ModeResult>;
  } | null>(null);

  useEffect(() => {
    setLocal({
      chain: getAllLocalResults(),
      duality: getAllModeResults("duality"),
      word: getAllModeResults("word"),
      mini: getAllModeResults("mini"),
    });
    fetch(`/api/modes/stats?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { rows?: ModeRow[] }) => setServerRows(d.rows ?? []))
      .catch(() => setServerRows([]));
  }, []);

  return useMemo(() => {
    if (local === null || serverRows === null) return EMPTY;

    // --- Chain: server history (cross-device) merged with this device --------
    const chainDays: Record<string, { reached: number; rounds: number }> = {};
    for (const [date, r] of Object.entries(local.chain)) {
      chainDays[date] = { reached: r.reached, rounds: r.rounds };
    }
    for (const [date, r] of Object.entries(serverChain)) {
      chainDays[date] = { reached: r.reached, rounds: r.rounds }; // server wins
    }
    const chainList = Object.values(chainDays);
    const chainPts = chainList.map((c) => chainDailyScore(c.reached, c.rounds));
    const chain: ChainStats = {
      played: chainList.length,
      avgCorrect: avg(chainList.reduce((a, c) => a + c.reached, 0), chainList.length),
      avgRounds: avg(chainList.reduce((a, c) => a + c.rounds, 0), chainList.length),
      perfect: chainList.filter((c) => c.rounds > 0 && c.reached >= c.rounds).length,
      avgPoints: avg(chainPts.reduce((a, p) => a + p, 0), chainPts.length),
      best: chainPts.reduce((m, p) => Math.max(m, p), 0),
    };

    // --- Duality -------------------------------------------------------------
    const dl = Object.values(mergeMode("duality", serverRows, local.duality));
    const dKnown = dl.filter((d) => d.won !== null);
    const dMoves = dl.filter((d) => d.moves !== null);
    const duality: DualityStats = {
      played: dl.length,
      solveRate: dKnown.length > 0 ? dKnown.filter((d) => d.won).length / dKnown.length : null,
      perfect: dl.filter((d) => d.won && d.moves === 0).length,
      avgMistakes: avg(dMoves.reduce((a, d) => a + (d.moves ?? 0), 0), dMoves.length),
      avgPoints: avg(dl.reduce((a, d) => a + d.score, 0), dl.length),
      best: dl.reduce((m, d) => Math.max(m, d.score), 0),
    };

    // --- Word ----------------------------------------------------------------
    const wl = Object.values(mergeMode("word", serverRows, local.word));
    const wins = wl.filter((d) => d.won === true);
    const winGuesses = wins.filter((d) => d.moves !== null && d.moves >= 1);
    const dist = Array(WORD_MAX_GUESSES).fill(0) as number[];
    for (const d of winGuesses) {
      const g = Math.min(WORD_MAX_GUESSES, Math.max(1, d.moves as number));
      dist[g - 1] += 1;
    }
    const word: WordStats = {
      played: wl.length,
      winRate: wl.length > 0 ? wins.length / wl.length : null,
      avgGuesses: avg(winGuesses.reduce((a, d) => a + (d.moves ?? 0), 0), winGuesses.length),
      dist,
      avgPoints: avg(wl.reduce((a, d) => a + d.score, 0), wl.length),
      best: wl.reduce((m, d) => Math.max(m, d.score), 0),
    };

    // --- Mini ----------------------------------------------------------------
    const ml = Object.values(mergeMode("mini", serverRows, local.mini));
    // Times only count SOLVED games - a revealed grid's clock isn't a solve.
    const mTimes = ml.filter((d) => d.seconds !== null && d.won !== false);
    const mini: MiniStats = {
      played: ml.length,
      avgSeconds: avg(mTimes.reduce((a, d) => a + (d.seconds ?? 0), 0), mTimes.length),
      bestSeconds: mTimes.length > 0 ? Math.min(...mTimes.map((d) => d.seconds as number)) : null,
      clean: ml.filter((d) => d.won !== false && d.moves === 0 && d.score > 0).length,
      avgPoints: avg(ml.reduce((a, d) => a + d.score, 0), ml.length),
      best: ml.reduce((m, d) => Math.max(m, d.score), 0),
    };

    return { chain, duality, word, mini, loading: false };
  }, [local, serverRows, serverChain]);
}

/** "2:41" / "0:58" - solve times the way a stopwatch would say them. */
export function formatSeconds(s: number): string {
  const whole = Math.max(0, Math.round(s));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
