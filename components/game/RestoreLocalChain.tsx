"use client";

import { useEffect } from "react";
import { getAllLocalResults, getSessionId } from "@/lib/playStore";

// ============================================================================
// Re-upload Chain results this device has that the server doesn't.
//
// Every finished Chain is written to localStorage before it is ever POSTed, so
// each player's own device holds a full copy of their Chain history. That makes
// the browsers the last line of defence when the server loses rows - a bad
// migration, a failed session merge, a restore that couldn't be run - and this
// is what claims it back.
//
// It is not a one-off repair script: it runs quietly for everyone, forever, so
// any result that failed to record (offline, a dropped request, a 500) heals
// the next time that player opens the site. /api/profile/complete is idempotent
// per session+date, so re-sending something already stored does nothing.
//
// Deliberately conservative: only dates the server has NO row for, only from
// this device, at most one pass per tab.
// ============================================================================

const DONE_KEY = "whohadmore:chainRestore";

/** Server round trips, spaced out - this is background repair, not the game. */
const GAP_MS = 250;

export function RestoreLocalChain() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (window.sessionStorage.getItem(DONE_KEY)) return;
        window.sessionStorage.setItem(DONE_KEY, "1");

        const local = getAllLocalResults();
        const dates = Object.keys(local);
        if (dates.length === 0) return;

        const session_id = getSessionId();
        if (!session_id) return;

        const res = await fetch(`/api/profile/results?session_id=${session_id}`);
        const data = (await res.json()) as { results?: Record<string, unknown> };
        const known = new Set(Object.keys(data.results ?? {}));

        const missing = dates.filter((d) => !known.has(d)).sort();
        if (missing.length === 0) return;

        for (const play_date of missing) {
          if (cancelled) return;
          const r = local[play_date];
          if (!r || typeof r.reached !== "number" || typeof r.rounds !== "number") continue;
          await fetch("/api/profile/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id, play_date, reached: r.reached, rounds: r.rounds }),
          }).catch(() => {});
          await new Promise((s) => setTimeout(s, GAP_MS));
        }
      } catch {
        /* repair is best-effort and must never affect play */
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
