"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { initialsFor } from "@/lib/wikimedia";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import {
  PINPOINT_POINTS_PER_ROUND,
  formatValue,
  pickPinpointCards,
  pinpointRange,
  pinpointScore,
} from "@/lib/modes";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "@/components/game/Fireworks";
import type { FullGame } from "@/types";

const ACCENT = "#FFB300";

interface PinpointGameProps {
  game: FullGame;
  date: string;
}

/**
 * Pinpoint: a card appears with its stat hidden - slide to guess the exact
 * number. Score scales with how close you land, 250 max per round.
 */
export function PinpointGame({ game, date }: PinpointGameProps) {
  const [seedKey, setSeedKey] = useState<string | null>(null);
  useEffect(() => setSeedKey(`${getSessionId()}:${date}`), [date]);

  const cards = useMemo(
    () => (seedKey ? pickPinpointCards(game.cards, seedKey) : []),
    [game, seedKey]
  );
  const { min, max, step } = useMemo(() => pinpointRange(game.cards), [game]);

  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);

  useEffect(() => {
    const prev = getModeResult("pinpoint", date);
    if (prev) setAlready({ score: prev.score, max: prev.maxScore });
  }, [date]);

  const card = cards[round];
  const total = scores.reduce((a, b) => a + b, 0);
  const maxTotal = cards.length * PINPOINT_POINTS_PER_ROUND;
  const done = cards.length > 0 && scores.length === cards.length;
  const mid = min + (max - min) / 2;
  const value = guess ?? mid;

  const lockIn = () => {
    if (!card || locked) return;
    const pts = pinpointScore(value, card.stat_value, min, max);
    setLocked(true);
    setScores((s) => [...s, pts]);
    if (pts >= PINPOINT_POINTS_PER_ROUND * 0.6) feedbackCorrect();
    else feedbackWrong();
  };

  const next = () => {
    setLocked(false);
    setGuess(null);
    setRound((r) => r + 1);
  };

  // Persist + submit once, when the last round resolves.
  useEffect(() => {
    if (!done) return;
    if (getModeResult("pinpoint", date)) return;
    saveModeResult("pinpoint", date, {
      score: total,
      maxScore: maxTotal,
      detail: scores,
      completedAt: new Date().toISOString(),
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), play_date: date, mode: "pinpoint", score: total }),
    }).catch(() => {});
  }, [done, date, total, maxTotal, scores]);

  const pct = ((value - min) / (max - min)) * 100;
  const actualPct = card ? ((card.stat_value - min) / (max - min)) * 100 : 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5">
      {isJuly4th(date) && <Fireworks />}
      <header className="relative z-[46] flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5" aria-label="Back to today's games">
          <BrandMark className="h-5 w-5" />
          <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
        </Link>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white"
          style={{ background: ACCENT }}
        >
          Pinpoint
        </span>
      </header>

      <div className="relative z-[46] mt-6 flex flex-1 flex-col">
        {already && scores.length === 0 ? (
          <PlayedSummary score={already.score} max={already.max} />
        ) : done ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="small-caps text-xs text-ink-secondary">Final score</p>
            <p className="mt-3 text-6xl font-extrabold tracking-tight text-ink tabular">
              {total}
              <span className="text-2xl text-ink-secondary"> / {maxTotal}</span>
            </p>
            <div className="mt-4 flex items-center gap-1.5">
              {scores.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full px-2.5 py-1 text-xs font-bold tabular text-ink"
                  style={{ background: `rgba(255, 179, 0, ${0.15 + 0.5 * (s / PINPOINT_POINTS_PER_ROUND)})` }}
                >
                  {s}
                </span>
              ))}
            </div>
            <Link href="/" className="mt-8 w-full max-w-xs rounded-2xl bg-cta px-6 py-3.5 text-[15px] font-bold text-white">
              Back to today&apos;s games
            </Link>
          </div>
        ) : card ? (
          <>
            <p className="small-caps text-center text-xs text-ink-secondary">{game.topic_label}</p>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              {cards.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === round ? "w-6" : "w-1.5"}`}
                  style={{ background: i <= round ? ACCENT : "rgb(var(--border))" }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="mt-5 flex flex-1 flex-col"
              >
                <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-3xl bg-ink shadow-xl sm:h-52 sm:w-52">
                  {card.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-condensed text-4xl font-bold text-white/80">
                      {initialsFor(card.entity_name)}
                    </span>
                  )}
                </div>
                <h1 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-ink">
                  {card.entity_name}
                </h1>
                <p className="mt-0.5 text-center text-[13px] text-ink-secondary">{game.stat_label}</p>

                {/* The guess */}
                <div className="mx-auto mt-6 w-full max-w-sm">
                  <p className="text-center text-4xl font-extrabold tracking-tight tabular" style={{ color: locked ? undefined : ACCENT }}>
                    {formatValue(value, game.stat_unit)}
                  </p>

                  <div className="relative mt-5">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      disabled={locked}
                      onChange={(e) => setGuess(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: ACCENT }}
                      aria-label={`Guess the ${game.stat_label}`}
                    />
                    {locked && (
                      <div
                        className="pointer-events-none absolute -top-1.5 h-6 w-1 rounded-full bg-correct"
                        style={{ left: `calc(${Math.min(99, Math.max(1, actualPct))}% - 2px)` }}
                      />
                    )}
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] font-semibold text-ink-secondary tabular">
                    <span>{formatValue(min, game.stat_unit)}</span>
                    <span>{formatValue(max, game.stat_unit)}</span>
                  </div>

                  {locked && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 rounded-2xl border border-border bg-surface p-4 text-center"
                    >
                      <p className="text-sm text-ink-secondary">
                        Actual:{" "}
                        <span className="font-extrabold text-ink tabular">
                          {formatValue(card.stat_value, game.stat_unit)}
                        </span>
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-ink tabular">
                        +{scores[scores.length - 1]} pts
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="mx-auto mt-auto w-full max-w-sm pt-6">
                  {locked ? (
                    <Button size="lg" className="w-full" onClick={next}>
                      {round + 1 < cards.length ? "Next card" : "See final score"}
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full" onClick={lockIn}>
                      Lock it in
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        ) : null}
      </div>
    </main>
  );
}

function PlayedSummary({ score, max }: { score: number; max: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="small-caps text-xs text-ink-secondary">Already played</p>
      <p className="mt-3 text-5xl font-extrabold tracking-tight text-ink tabular">
        {score}
        <span className="text-2xl text-ink-secondary"> / {max}</span>
      </p>
      <p className="mt-2 text-sm text-ink-secondary">Come back tomorrow for new cards.</p>
      <Link href="/" className="mt-6 rounded-2xl bg-cta px-6 py-3.5 text-[15px] font-bold text-white">
        Back to today&apos;s games
      </Link>
    </div>
  );
}
