"use client";

import { track } from "@vercel/analytics";
import { getSessionId } from "@/lib/playStore";

/**
 * One call, two pipelines: Vercel Web Analytics (visible on their paid plans)
 * AND our own /api/track table (visible with plain SQL on any plan). Both are
 * fire-and-forget - analytics must never block or break the game.
 */
export function trackEvent(
  event: "share_click" | "results_modal_shown" | "past_card_click",
  props: { surface?: string; game?: string; date?: string } = {}
): void {
  try {
    // If this fires before <Analytics /> has initialized (e.g. an effect on a
    // fresh page load), pre-seed the same queue shim Vercel's bootstrap uses so
    // the event queues instead of being dropped.
    const w = window as unknown as { va?: (...args: unknown[]) => void; vaq?: unknown[] };
    if (typeof w.va !== "function") {
      w.va = (...args: unknown[]) => {
        (w.vaq = w.vaq ?? []).push(args);
      };
    }
    const { date: _date, ...vercelProps } = props;
    track(event, vercelProps);
  } catch {
    /* best-effort */
  }
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, session_id: getSessionId(), ...props }),
      keepalive: true, // survives the page unloading right after a share
    }).catch(() => {});
  } catch {
    /* best-effort */
  }
}
