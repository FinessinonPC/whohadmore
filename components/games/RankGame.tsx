"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { initialsFor } from "@/lib/wikimedia";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import {
  RANK_POINTS_PER_SLOT,
  formatValue,
  pickRankCards,
  rankScore,
} from "@/lib/modes";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "@/components/game/Fireworks";
import type { FullGame, GameCard } from "@/types";

const ACCENT = "#2E6BFF";

interface RankGameProps {
  game: FullGame;
  date: string;
}

/**
 * Rank Five: five of today's cards, tap them in order from highest to lowest,
 * lock in, and see how many you placed exactly right. 200 points per slot.
 */
export function RankGame({ game, date }: RankGameProps) {
  const [seedKey, setSeedKey] = useState<string | null>(null);
  useEffect(() => setSeedKey(`${getSessionId()}:${date}`), [date]);

  const cards = useMemo(
    () => (seedKey ? pickRankCards(game.cards, seedKey) : []),
    [game, seedKey]
  );
  const correct = useMemo(
    () => [...cards].sort((a, b) => b.stat_value - a.stat_value),
    [cards]
  );

  // picked[i] = card id assigned to slot i (slot 0 = highest).
  const [picked, setPicked] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);

  useEffect(() => {
    const prev = getModeResult("rank", date);
    if (prev) setAlready({ score: prev.score, max: prev.maxScore });
  }, [date]);

  const slotOf = (id: string) => picked.indexOf(id);

  const tap = (card: GameCard) => {
    if (revealed) return;
    const i = slotOf(card.id);
    if (i >= 0) {
      // Unpick this card and everything after it (keeps the sequence honest).
      setPicked((p) => p.slice(0, i));
    } else if (picked.length < cards.length) {
      setPicked((p) => [...p, card.id]);
    }
  };

  const lockIn = () => {
    const order = picked
      .map((id) => cards.find((c) => c.id === id))
      .filter(Boolean) as GameCard[];
    const pts = rankScore(order, correct);
    const detail = order.map((c, i) => (c.id === correct[i].id ? RANK_POINTS_PER_SLOT : 0));
    setScore(pts);
    setRevealed(true);
    if (pts >= (cards.length * RANK_POINTS_PER_SLOT) / 2) feedbackCorrect();
    else feedbackWrong();

    const max = cards.length * RANK_POINTS_PER_SLOT;
    saveModeResult("rank", date, {
      score: pts,
      maxScore: max,
      detail,
      completedAt: new Date().toISOString(),
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), play_date: date, mode: "rank", score: pts }),
    }).catch(() => {});
  };

  const max = cards.length * RANK_POINTS_PER_SLOT;

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
          Rank Five
        </span>
      </header>

      <div className="relative z-[46] mt-6 flex flex-1 flex-col">
        {already && !revealed ? (
          <PlayedSummary score={already.score} max={already.max} />
        ) : (
          <>
            <p className="small-caps text-center text-xs text-ink-secondary">{game.topic_label}</p>
            <h1 className="mt-1.5 text-center text-2xl font-extrabold tracking-tight text-ink">
              {revealed ? (
                <>
                  {score} <span className="text-ink-secondary">/ {max}</span>
                </>
              ) : (
                <>Order them, highest first</>
              )}
            </h1>
            <p className="mt-1 text-center text-[13px] text-ink-secondary">
              {revealed
                ? `${score / RANK_POINTS_PER_SLOT} of ${cards.length} in exactly the right spot`
                : `Tap in order of ${game.stat_label.toLowerCase()} - most first. Tap again to undo.`}
            </p>

            <ul className="mt-5 flex flex-col gap-2.5">
              {cards.map((card, idx) => {
                const slot = slotOf(card.id);
                const rightSlot = correct.findIndex((c) => c.id === card.id);
                const wasRight = revealed && slot === rightSlot;
                return (
                  <motion.li
                    key={card.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                  >
                    <button
                      onClick={() => tap(card)}
                      disabled={revealed}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all ${
                        revealed
                          ? wasRight
                            ? "border-correct bg-correct/10"
                            : "border-wrong/60 bg-wrong/5"
                          : slot >= 0
                            ? "bg-surface"
                            : "border-border bg-surface hover:border-ink/25"
                      }`}
                      style={!revealed && slot >= 0 ? { borderColor: ACCENT } : undefined}
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink">
                        {card.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={card.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center font-condensed text-lg font-bold text-white/80">
                            {initialsFor(card.entity_name)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold text-ink">
                          {card.entity_name}
                        </span>
                        {revealed && (
                          <span className="tabular text-sm font-semibold text-ink-secondary">
                            {formatValue(card.stat_value, game.stat_unit)}
                            {!wasRight && (
                              <span className="ml-2 text-xs font-bold text-wrong">
                                should be #{rightSlot + 1}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                      {revealed ? (
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                            wasRight ? "bg-correct" : "bg-wrong"
                          }`}
                        >
                          {wasRight ? "✓" : "✕"}
                        </span>
                      ) : (
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                            slot >= 0 ? "text-white" : "border-2 border-border text-ink-secondary"
                          }`}
                          style={slot >= 0 ? { background: ACCENT } : undefined}
                        >
                          {slot >= 0 ? slot + 1 : ""}
                        </span>
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </ul>

            <div className="mt-6 flex items-center gap-2.5">
              {revealed ? (
                <Button size="lg" className="w-full" onClick={() => (window.location.href = "/")}>
                  Back to today&apos;s games
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="shrink-0"
                    onClick={() => setPicked([])}
                    disabled={picked.length === 0}
                  >
                    Reset
                  </Button>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={lockIn}
                    disabled={picked.length !== cards.length}
                  >
                    {picked.length === cards.length
                      ? "Lock it in"
                      : `Pick ${cards.length - picked.length} more`}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function PlayedSummary({ score, max }: { score: number; max: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="small-caps text-xs text-ink-secondary">Already played</p>
      <p className="mt-3 text-5xl font-extrabold tracking-tight text-ink">
        {score}
        <span className="text-2xl text-ink-secondary"> / {max}</span>
      </p>
      <p className="mt-2 text-sm text-ink-secondary">Come back tomorrow for a fresh five.</p>
      <Link href="/" className="mt-6 rounded-2xl bg-cta px-6 py-3.5 text-[15px] font-bold text-white">
        Back to today&apos;s games
      </Link>
    </div>
  );
}
