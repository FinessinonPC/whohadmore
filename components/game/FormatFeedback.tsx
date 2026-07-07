"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSessionId } from "@/lib/playStore";

const KEY = "whohadmore:format-feedback:v1";

/**
 * A one-time thumbs up / down on the new multi-game format, shown once a
 * player has finished their first day. Stored locally so it never nags, and
 * fired to /api/feedback (best-effort) so we can read the pulse.
 */
export function FormatFeedback() {
  const [done, setDone] = useState<boolean | null>(null); // null = not decided yet
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    try {
      setDone(Boolean(window.localStorage.getItem(KEY)));
    } catch {
      setDone(true);
    }
  }, []);

  function vote(value: "up" | "down") {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setThanks(true);
    void fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), topic: "format", value }),
    }).catch(() => {});
    window.setTimeout(() => setDone(true), 1400);
  }

  if (done !== false) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mt-5 w-full rounded-2xl border border-border bg-surface p-4 text-center"
      >
        {thanks ? (
          <p className="py-2 text-sm font-bold text-ink">Thanks - noted.</p>
        ) : (
          <>
            <p className="text-sm font-bold text-ink">Liking the new four-game format?</p>
            <p className="mt-0.5 text-xs text-ink-secondary">
              One tap - it helps shape where this goes.
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => vote("up")}
                aria-label="Thumbs up"
                className="flex h-12 w-16 items-center justify-center rounded-2xl border border-border bg-background text-2xl transition-colors hover:border-correct hover:bg-correct/10"
              >
                👍
              </button>
              <button
                onClick={() => vote("down")}
                aria-label="Thumbs down"
                className="flex h-12 w-16 items-center justify-center rounded-2xl border border-border bg-background text-2xl transition-colors hover:border-wrong hover:bg-wrong/10"
              >
                👎
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
