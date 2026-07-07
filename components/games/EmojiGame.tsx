"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { EMOJI_POINTS_PER_ROUND, modeDef } from "@/lib/modes";
import { getEmojiDaily } from "@/lib/contentPacks";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";

const ACCENT = modeDef("emoji").accent;

/**
 * Emoji: five pictures-only puzzles - decode the movie / show / phrase.
 * 200 points per correct pick.
 */
export function EmojiGame({ date }: { date: string }) {
  const day = getEmojiDaily(date);
  const rounds = day.rounds;

  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);

  useEffect(() => {
    const prev = getModeResult("emoji", date);
    if (prev) setAlready({ score: prev.score, max: prev.maxScore });
  }, [date]);

  const current = rounds[round];
  const done = round >= rounds.length;
  const revealed = choice !== null;
  const score = hits * EMOJI_POINTS_PER_ROUND;
  const max = rounds.length * EMOJI_POINTS_PER_ROUND;

  const pick = (i: number) => {
    if (!current || revealed) return;
    setChoice(i);
    if (i === current.answer) {
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

  // Persist once finished.
  useEffect(() => {
    if (!done || rounds.length === 0) return;
    if (getModeResult("emoji", date)) return;
    saveModeResult("emoji", date, {
      score,
      maxScore: max,
      detail: [],
      completedAt: new Date().toISOString(),
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), play_date: date, mode: "emoji", score }),
    }).catch(() => {});
  }, [done, score, max, date, rounds.length]);

  return (
    <GameShell mode="emoji" date={date}>
      {already && round === 0 && !revealed ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="small-caps text-xs text-ink-secondary">Already played</p>
          <p className="mt-3 font-condensed text-6xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-3xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mb-6 mt-2 text-sm text-ink-secondary">Fresh puzzles tomorrow.</p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="emoji" />
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
            {hits} of {rounds.length} decoded
          </p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="emoji" />
          </div>
        </div>
      ) : current ? (
        <>
          <div className="flex items-center justify-center gap-1.5">
            {rounds.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === round ? "w-6" : "w-1.5"}`}
                style={{ background: i <= round ? ACCENT : "rgb(var(--border))" }}
              />
            ))}
          </div>
          <p className="small-caps mt-3 text-center text-[11px] text-ink-secondary">{day.theme}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={round}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="flex flex-1 flex-col"
            >
              <div className="flex flex-1 items-center justify-center">
                <p className="text-center text-6xl leading-tight tracking-widest sm:text-7xl">
                  {current.emoji}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {current.options.map((opt, i) => {
                  const isAnswer = i === current.answer;
                  const chosen = choice === i;
                  return (
                    <button
                      key={opt}
                      onClick={() => pick(i)}
                      disabled={revealed}
                      className={`rounded-2xl px-4 py-4 text-center font-condensed text-lg font-semibold uppercase tracking-wide transition-all active:scale-[0.98] disabled:pointer-events-none ${
                        revealed
                          ? isAnswer
                            ? "bg-correct text-[#0B0D10]"
                            : chosen
                              ? "bg-wrong text-white"
                              : "bg-surface text-ink-secondary opacity-50"
                          : "bg-surface text-ink hover:-translate-y-0.5"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mx-auto w-full max-w-sm pt-4">
                {revealed ? (
                  <Button size="lg" className="w-full" onClick={next}>
                    {round + 1 < rounds.length ? "Next puzzle" : "See final score"}
                  </Button>
                ) : (
                  <p className="text-center text-[11px] font-semibold text-ink-secondary">
                    +{EMOJI_POINTS_PER_ROUND} per correct decode
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      ) : null}
    </GameShell>
  );
}
