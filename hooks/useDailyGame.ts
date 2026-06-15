"use client";

import { useEffect, useState } from "react";
import type { FullGame } from "@/types";

interface DailyGameState {
  game: FullGame | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the published game for a given date from /api/game/[date].
 * Used by both the daily screen and archive replays — just pass the date.
 */
export function useDailyGame(date: string): DailyGameState {
  const [state, setState] = useState<DailyGameState>({
    game: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ game: null, loading: true, error: null });

    (async () => {
      try {
        const res = await fetch(`/api/game/${date}`);
        const data = (await res.json()) as { game?: FullGame; error?: string };
        if (cancelled) return;

        if (!res.ok) {
          setState({ game: null, loading: false, error: data.error ?? "Failed to load" });
          return;
        }
        setState({ game: data.game ?? null, loading: false, error: null });
      } catch {
        if (!cancelled) {
          setState({ game: null, loading: false, error: "Network error" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date]);

  return state;
}
