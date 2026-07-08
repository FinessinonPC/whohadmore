"use client";

import { useEffect, useState } from "react";
import { getModeResult } from "@/lib/modeStore";
import { getSessionId } from "@/lib/playStore";
import { isAdminPreview } from "@/lib/adminClient";
import type { ModeId } from "@/lib/modes";

export interface ModeGuard {
  /** The recorded result if this game was already played (locks replay). */
  already: { score: number; max: number } | null;
  /** True while we resolve whether it was already played (avoids a replay window). */
  checking: boolean;
}

/**
 * Decides whether a quick game (Duality/Word/Mini) has already been played, so
 * it can't be replayed and the score stays put. Checks this device first, then
 * the server (the account / session record) - so a cleared cache or a fresh
 * sign-in on the same account still blocks a replay. Admin previews skip it.
 */
export function useModeGuard(mode: ModeId, date: string, maxScore: number): ModeGuard {
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAlready(null);
    setChecking(true);
    if (isAdminPreview()) {
      setChecking(false);
      return;
    }
    // On-device result is instant and authoritative for this device.
    const local = getModeResult(mode, date);
    if (local) {
      setAlready({ score: local.score, max: local.maxScore });
      setChecking(false);
      return;
    }
    // Otherwise ask the server: the account (or this session) may have a result
    // recorded elsewhere / before the cache was cleared.
    let cancelled = false;
    fetch(`/api/modes/results?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { results?: Record<string, Record<string, number>> }) => {
        if (cancelled) return;
        const score = d.results?.[date]?.[mode];
        if (typeof score === "number") setAlready({ score, max: maxScore });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, date, maxScore]);

  return { already, checking };
}
