"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/playStore";

/** A completed game as recorded on the account/session (server truth). */
export interface PlayedResult {
  reached: number;
  rounds: number;
  lives: number;
  timeSeconds: number;
  xpEarned: number;
}

// Cache per session id so switching tabs doesn't refetch / flash.
let cache: { sid: string; map: Record<string, PlayedResult> } | null = null;

/**
 * Every date this account (current session) has completed, keyed by play_date.
 * Lets the daily game and the archive reflect games played on ANY device once
 * signed in — not just this device's localStorage.
 */
export function usePlayedResults(): Record<string, PlayedResult> {
  const [map, setMap] = useState<Record<string, PlayedResult>>(() =>
    cache && typeof window !== "undefined" && cache.sid === getSessionId() ? cache.map : {}
  );

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;
    let cancelled = false;
    fetch(`/api/profile/results?session_id=${sid}`)
      .then((r) => r.json())
      .then((d: { results?: Record<string, PlayedResult> }) => {
        if (cancelled) return;
        const m = d.results ?? {};
        cache = { sid, map: m };
        setMap(m);
      })
      .catch(() => {
        /* offline / not configured — leave whatever we have */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return map;
}
