"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { DUALITY_POINTS_PER_ITEM, modeDef } from "@/lib/modes";
import type { DualityDay } from "@/lib/contentPacks";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";

const ACCENT = modeDef("duality").accent;

/**
 * Duality: two categories, eight things - sort each one to its side.
 * 125 points per correct sort, max 1000. Content resolves server-side
 * (custom admin day, else the pack) and arrives as a prop.
 */
export function DualityGame({ day, date }: { day: DualityDay; date: string }) {
  const items = day.items;

  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [verdict, setVerdict] = useState<null | { right: boolean; side: "L" | "R"; note?: string }>(null);
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);

  useEffect(() => {
    const prev = getModeResult("duality", date);
    if (prev) setAlready({ score: prev.score, max: prev.maxScore });
  }, [date]);

  const item = items[index];
  const done = index >= items.length;
  const score = hits * DUALITY_POINTS_PER_ITEM;
  const max = items.length * DUALITY_POINTS_PER_ITEM;

  const answer = (side: "L" | "R") => {
    if (!item || verdict) return;
    const right = item.side === side;
    setVerdict({ right, side: item.side, note: item.note });
    if (right) {
      setHits((h) => h + 1);
      feedbackCorrect();
    } else {
      feedbackWrong();
    }
    window.setTimeout(() => {
      setVerdict(null);
      setIndex((i) => i + 1);
    }, right ? 650 : 1250);
  };

  // Persist + submit once at the end.
  useEffect(() => {
    if (!done || items.length === 0) return;
    if (getModeResult("duality", date)) return;
    saveModeResult("duality", date, {
      score,
      maxScore: max,
      detail: [],
      completedAt: new Date().toISOString(),
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), play_date: date, mode: "duality", score }),
    }).catch(() => {});
  }, [done, date, score, max, items.length]);

  return (
    <GameShell mode="duality" date={date}>
      {already && index === 0 && !verdict ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="small-caps text-xs text-ink-secondary">Already played</p>
          <p className="mt-3 font-condensed text-6xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-3xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mb-6 mt-2 text-sm text-ink-secondary">A new pair of worlds tomorrow.</p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="duality" />
          </div>
        </div>
      ) : done ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="small-caps text-xs text-ink-secondary">Final score</p>
          <p className="mt-3 font-condensed text-7xl font-semibold text-ink tabular">
            {score}
            <span className="text-3xl text-ink-secondary"> / {max}</span>
          </p>
          <p className="mb-8 mt-2 text-sm font-semibold text-ink-secondary">
            {hits} of {items.length} sorted to the right side
          </p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="duality" />
          </div>
        </div>
      ) : (
        <>
          {/* progress */}
          <div className="flex items-center justify-center gap-1.5">
            {items.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6" : "w-1.5"}`}
                style={{ background: i <= index ? ACCENT : "rgb(var(--border))" }}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-ink-secondary">Which world does it belong to?</p>

          {/* the item */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22 }}
                className={`w-full rounded-3xl border-2 px-6 py-12 text-center shadow-sm transition-colors ${
                  verdict ? (verdict.right ? "border-correct bg-correct/10" : "border-wrong bg-wrong/10") : "border-border bg-surface"
                }`}
              >
                <p className="text-balance font-condensed text-4xl font-semibold uppercase tracking-wide text-ink sm:text-5xl">
                  {item.text}
                </p>
                <div className="mt-3 h-5 text-sm font-semibold">
                  {verdict ? (
                    <span className={verdict.right ? "text-correct" : "text-wrong"}>
                      {verdict.right ? "Correct" : `${verdict.side === "L" ? day.left : day.right}`}
                      {verdict.note ? ` · ${verdict.note}` : ""}
                    </span>
                  ) : (
                    <span className="text-ink-secondary tabular">
                      +{DUALITY_POINTS_PER_ITEM} if you nail it
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* the two worlds - two solid blocks, no borders */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => answer("L")}
              disabled={!!verdict}
              className="rounded-2xl px-4 py-6 font-condensed text-xl font-semibold uppercase tracking-wide transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:pointer-events-none"
              style={{ background: ACCENT, color: "#0B0D10" }}
            >
              {day.left}
            </button>
            <button
              onClick={() => answer("R")}
              disabled={!!verdict}
              className="rounded-2xl bg-cta px-4 py-6 font-condensed text-xl font-semibold uppercase tracking-wide text-background transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:pointer-events-none"
            >
              {day.right}
            </button>
          </div>
        </>
      )}
    </GameShell>
  );
}
