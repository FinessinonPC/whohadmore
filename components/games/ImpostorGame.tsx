"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { IMPOSTOR_POINTS_PER_ROUND, modeDef } from "@/lib/modes";
import { getImpostorDaily } from "@/lib/contentPacks";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";

const ACCENT = modeDef("impostor").accent;

/**
 * Impostor: four things - three share a connection, one is lying. Tap the
 * impostor. 200 points per round, max 1000. Content from the daily pack.
 */
export function ImpostorGame({ date }: { date: string }) {
  const day = getImpostorDaily(date);
  const rounds = day.rounds;

  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);

  useEffect(() => {
    const prev = getModeResult("impostor", date);
    if (prev) setAlready({ score: prev.score, max: prev.maxScore });
  }, [date]);

  const current = rounds[round];
  const done = round >= rounds.length;
  const revealed = choice !== null;
  const score = hits * IMPOSTOR_POINTS_PER_ROUND;
  const max = rounds.length * IMPOSTOR_POINTS_PER_ROUND;

  const pick = (i: number) => {
    if (!current || revealed) return;
    setChoice(i);
    if (i === current.impostor) {
      setHits((h) => h + 1);
      feedbackCorrect();
    } else {
      feedbackWrong();
    }
  };

  const next = () => {
    setChoice(null);
    setRound((r) => r + 1);
  };

  // Persist + submit once at the end.
  useEffect(() => {
    if (!done || rounds.length === 0) return;
    if (getModeResult("impostor", date)) return;
    saveModeResult("impostor", date, {
      score,
      maxScore: max,
      detail: [],
      completedAt: new Date().toISOString(),
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), play_date: date, mode: "impostor", score }),
    }).catch(() => {});
  }, [done, date, score, max, rounds.length]);

  return (
    <GameShell mode="impostor" date={date}>
      {already && round === 0 && !revealed ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="small-caps text-xs text-ink-secondary">Already played</p>
          <p className="mt-3 font-condensed text-6xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-3xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mb-6 mt-2 text-sm text-ink-secondary">New impostors arrive tomorrow.</p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="impostor" />
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
            {hits} of {rounds.length} impostors caught
          </p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="impostor" />
          </div>
        </div>
      ) : current ? (
        <>
          {/* progress */}
          <div className="flex items-center justify-center gap-1.5">
            {rounds.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === round ? "w-6" : "w-1.5"}`}
                style={{ background: i <= round ? ACCENT : "rgb(var(--border))" }}
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="font-condensed text-2xl font-semibold uppercase tracking-wide text-ink">
              Three belong together
            </p>
            <p className="mt-1 text-sm text-ink-secondary">Tap the one that doesn&apos;t.</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={round}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="mt-6 grid grid-cols-2 gap-3"
            >
              {current.options.map((opt, i) => {
                const isImpostor = i === current.impostor;
                const chosen = choice === i;
                return (
                  <button
                    key={opt}
                    onClick={() => pick(i)}
                    disabled={revealed}
                    className={`rounded-2xl border-2 px-4 py-8 text-center font-condensed text-xl font-semibold uppercase tracking-wide transition-all active:scale-[0.98] disabled:pointer-events-none ${
                      revealed
                        ? isImpostor
                          ? "border-correct bg-correct/15 text-correct"
                          : chosen
                            ? "border-wrong bg-wrong/10 text-wrong"
                            : "border-border bg-surface text-ink-secondary opacity-60"
                        : "border-border bg-surface text-ink hover:-translate-y-0.5"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex min-h-[4.5rem] flex-col items-center justify-center text-center">
            {revealed && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p className={`text-sm font-bold ${choice === current.impostor ? "text-correct" : "text-wrong"}`}>
                  {choice === current.impostor
                    ? `Caught it · +${IMPOSTOR_POINTS_PER_ROUND}`
                    : "That one belonged"}
                </p>
                <p className="mt-1 text-sm text-ink-secondary">{current.connection}</p>
              </motion.div>
            )}
          </div>

          <div className="mx-auto w-full max-w-sm pb-2">
            {revealed && (
              <Button size="lg" className="w-full" onClick={next}>
                {round + 1 < rounds.length ? "Next round" : "See final score"}
              </Button>
            )}
          </div>
        </>
      ) : null}
    </GameShell>
  );
}
