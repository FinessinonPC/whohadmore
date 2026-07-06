"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/ui/TopNav";
import { initialsFor } from "@/lib/wikimedia";
import { formatDisplayDate } from "@/lib/date";
import { getLocalResult, getProgress } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { MODES, type ModeDef } from "@/lib/modes";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "@/components/game/Fireworks";
import type { FullGame, GameCard } from "@/types";

interface GameHubProps {
  game: FullGame | null;
  date: string;
  gameNumber: number;
}

interface TileState {
  played: boolean;
  label: string; // "Play" | "Resume" | score string
  score: number; // contribution to today's total
}

function iconFor(id: ModeDef["id"], accent: string) {
  switch (id) {
    case "chain":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path d="M12 3.5 L19 11 H5 Z" fill={accent} />
          <path d="M12 20.5 L5 13 H19 Z" fill="#FF3B30" />
        </svg>
      );
    case "rank":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <rect x="4" y="4" width="16" height="3.6" rx="1.8" fill={accent} />
          <rect x="4" y="10.2" width="11" height="3.6" rx="1.8" fill={accent} opacity="0.65" />
          <rect x="4" y="16.4" width="6.5" height="3.6" rx="1.8" fill={accent} opacity="0.35" />
        </svg>
      );
    case "pinpoint":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <rect x="3" y="11" width="18" height="2.4" rx="1.2" fill={accent} opacity="0.35" />
          <circle cx="14.5" cy="12.2" r="4.4" fill={accent} />
          <circle cx="14.5" cy="12.2" r="1.7" fill="white" />
        </svg>
      );
  }
}

/** A fanned peek at today's cards, for the flagship tile. */
function MiniMontage({ cards }: { cards: GameCard[] }) {
  const withImg = cards.filter((c) => c.image_url);
  const pool = (withImg.length >= 3 ? withImg : cards).slice(0, 4);
  return (
    <div className="flex -space-x-3">
      {pool.map((c, i) => (
        <span
          key={c.id}
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-background bg-ink shadow-sm"
          style={{ zIndex: pool.length - i, transform: `rotate(${(i - 1.5) * 3}deg)` }}
        >
          {c.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-condensed text-sm font-bold text-white/80">
              {initialsFor(c.entity_name)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * The daily hub: one topic, three ways to play, one combined total.
 * Sleek lessgames-style tile list - each game is a quick one-screen session.
 */
export function GameHub({ game, date, gameNumber }: GameHubProps) {
  const [tiles, setTiles] = useState<Record<string, TileState>>({});

  useEffect(() => {
    const chain = getLocalResult(date);
    const prog = getProgress(date);
    const rank = getModeResult("rank", date);
    const pin = getModeResult("pinpoint", date);
    setTiles({
      chain: chain
        ? { played: true, label: `${chain.reached}/${chain.rounds}`, score: chain.xpEarned }
        : { played: false, label: prog && prog.roundsPlayed > 0 ? "Resume" : "Play", score: 0 },
      rank: rank
        ? { played: true, label: `${rank.score}`, score: rank.score }
        : { played: false, label: "Play", score: 0 },
      pinpoint: pin
        ? { played: true, label: `${pin.score}`, score: pin.score }
        : { played: false, label: "Play", score: 0 },
    });
  }, [date]);

  const playedCount = Object.values(tiles).filter((t) => t.played).length;
  const total = Object.values(tiles).reduce((a, t) => a + t.score, 0);

  if (!game || game.cards.length < 2) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-game flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-extrabold text-ink">No game today</h1>
        <p className="text-sm text-ink-secondary">Check back soon - a new game drops daily.</p>
        <Link href="/archive" className="mt-2 rounded-full border border-border bg-surface px-5 py-2 text-sm font-semibold text-ink">
          Browse the archive
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-12 pt-5 sm:max-w-xl">
      {isJuly4th(date) && <Fireworks />}
      <TopNav />

      {isJuly4th(date) && (
        <div className="relative z-[46] mx-auto mt-2 rounded-full border border-[#FF3B30]/25 bg-gradient-to-r from-[#FF3B30]/12 via-transparent to-[#2E6BFF]/12 px-5 py-1.5 text-sm font-bold text-ink">
          Happy Fourth of July 🌭
        </div>
      )}

      <motion.div
        className="relative z-[46] flex flex-1 flex-col"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Today header */}
        <div className="mt-7 text-center">
          <p className="small-caps text-xs text-ink-secondary">
            {formatDisplayDate(date)} · Game No. {gameNumber}
          </p>
          <h1 className="mx-auto mt-2 max-w-md text-balance text-3xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-4xl">
            {game.topic_label}
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            One topic. Three quick games. One total.
          </p>
        </div>

        {/* Combined total */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
          <div>
            <p className="small-caps text-[11px] text-ink-secondary">Today&apos;s total</p>
            <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-ink tabular">
              {total.toLocaleString("en-US")}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              {MODES.map((m) => (
                <span
                  key={m.id}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: tiles[m.id]?.played ? m.accent : "rgb(var(--border))",
                  }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs font-semibold text-ink-secondary">
              {playedCount} of {MODES.length} played
            </p>
          </div>
        </div>

        {/* Game tiles */}
        <div className="mt-4 flex flex-col gap-3">
          {MODES.map((mode, i) => {
            const t = tiles[mode.id];
            const played = t?.played ?? false;
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.07 }}
              >
                <Link
                  href={mode.href(date)}
                  className="group flex items-center gap-4 rounded-3xl border border-border bg-surface p-4 transition-all hover:border-ink/20 hover:shadow-sm sm:p-5"
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: `${mode.accent}1A` }}
                  >
                    {iconFor(mode.id, mode.accent)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[17px] font-extrabold tracking-tight text-ink">
                        {mode.name}
                      </span>
                      {mode.id === "chain" && (
                        <span className="hidden sm:block">
                          <MiniMontage cards={game.cards} />
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-secondary">
                      {mode.tagline}
                    </span>
                  </span>
                  {played ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-correct/30 bg-correct/10 px-3.5 py-1.5 text-sm font-extrabold text-correct tabular">
                      ✓ {t.label}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-cta px-5 py-2 text-sm font-bold text-white transition-transform group-hover:scale-[1.03]">
                      {t?.label ?? "Play"}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer row */}
        <div className="mt-6 flex items-center justify-center gap-5 text-xs font-semibold text-ink-secondary">
          <Link href="/leaderboard" className="transition-colors hover:text-ink">
            Today&apos;s leaderboard
          </Link>
          <span className="text-border">·</span>
          <Link href="/archive" className="transition-colors hover:text-ink">
            Past games
          </Link>
          <span className="text-border">·</span>
          <Link href="/about" className="transition-colors hover:text-ink">
            How it works
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
