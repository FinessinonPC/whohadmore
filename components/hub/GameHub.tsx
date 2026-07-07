"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/ui/TopNav";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { formatDisplayDate } from "@/lib/date";
import { getLocalResult, getProgress } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { LIVE_MODES, MODES, type ModeDef } from "@/lib/modes";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "@/components/game/Fireworks";
import type { FullGame } from "@/types";

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

/** The trick-letter color for each wordmark, tuned to its card. */
function altFor(mode: ModeDef): string | undefined {
  switch (mode.id) {
    case "duality":
      return "#FFFFFF"; // DUAL dark / ITY white on cyan
    case "word":
      return "#FFFFFF"; // white tile with dark ring on yellow
    case "emoji":
      return "#FFFFFF"; // white face, dark features, on orange
    default:
      return undefined; // currentColor
  }
}

/**
 * The daily hub, games-first: a thin header, the date, then each game as a
 * big solid-color block whose wordmark is the hero. No icons in boxes, no
 * marketing copy - the cards ARE the page.
 */
export function GameHub({ game, date, gameNumber }: GameHubProps) {
  const [tiles, setTiles] = useState<Record<string, TileState>>({});

  useEffect(() => {
    const next: Record<string, TileState> = {};
    for (const m of LIVE_MODES) {
      if (m.id === "chain") {
        const chain = getLocalResult(date);
        const prog = getProgress(date);
        next.chain = chain
          ? { played: true, label: `${chain.reached}/${chain.rounds}`, score: chain.xpEarned }
          : { played: false, label: prog && prog.roundsPlayed > 0 ? "Resume" : "Play", score: 0 };
      } else {
        const r = getModeResult(m.id, date);
        next[m.id] = r
          ? { played: true, label: `${r.score}`, score: r.score }
          : { played: false, label: "Play", score: 0 };
      }
    }
    setTiles(next);
  }, [date]);

  const playedCount = LIVE_MODES.filter((m) => tiles[m.id]?.played).length;
  const total = LIVE_MODES.reduce((a, m) => a + (tiles[m.id]?.score ?? 0), 0);

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
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-4 pb-12 pt-5">
      {isJuly4th(date) && <Fireworks />}
      <TopNav />

      {isJuly4th(date) && (
        <div className="relative z-[46] mx-auto mt-2 rounded-full border border-[#FF3B30]/25 bg-gradient-to-r from-[#FF3B30]/12 via-transparent to-[#2E6BFF]/12 px-5 py-1.5 text-sm font-bold text-ink">
          Happy Fourth of July 🌭
        </div>
      )}

      <div className="relative z-[46] flex flex-1 flex-col">
        {/* Date + running total, one quiet line */}
        <div className="mt-7 flex items-end justify-between px-1">
          <div>
            <p className="small-caps text-[11px] text-ink-secondary">
              {formatDisplayDate(date)} · No. {gameNumber}
            </p>
            <p className="mt-1 font-condensed text-2xl font-semibold uppercase leading-none tracking-wide text-ink">
              Today&apos;s games
            </p>
          </div>
          <div className="pb-0.5 text-right">
            <p className="font-condensed text-2xl font-semibold leading-none text-ink tabular">
              {total.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-ink-secondary">
              {playedCount}/{LIVE_MODES.length} played
            </p>
          </div>
        </div>

        {/* The games - each one a solid block, the wordmark is the logo */}
        <div className="mt-4 flex flex-col gap-3">
          {MODES.map((mode, i) => {
            const t = tiles[mode.id];
            const played = t?.played ?? false;
            const soon = mode.status === "soon";

            if (soon) {
              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="relative rounded-[26px] border border-border bg-surface px-6 py-6"
                >
                  <GameWordmark
                    mode={mode.id}
                    className="text-3xl"
                    alt={undefined}
                  />
                  <p className="mt-1.5 text-[13px] font-semibold text-ink-secondary">
                    {mode.tagline}
                  </p>
                  <span className="small-caps absolute right-5 top-5 text-[10px] font-bold text-ink-secondary">
                    Soon
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
              >
                <Link
                  href={mode.href(date)}
                  className="group relative block rounded-[26px] px-6 py-7 transition-transform duration-150 hover:scale-[1.015] active:scale-[0.985]"
                  style={{ background: mode.accent, color: mode.contrast }}
                >
                  {mode.id === "chain" && (
                    <p className="small-caps mb-1 text-[11px] font-bold opacity-70">
                      Today · {game.topic_label}
                    </p>
                  )}
                  <GameWordmark mode={mode.id} className="text-[2.6rem] sm:text-5xl" alt={altFor(mode)} />
                  <p className="mt-1.5 max-w-[26ch] text-[13px] font-semibold leading-snug opacity-75">
                    {mode.tagline}
                  </p>

                  {played ? (
                    <span
                      className="absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-extrabold tabular"
                      style={{ background: `${mode.contrast}22` }}
                    >
                      ✓ {t.label}
                    </span>
                  ) : t?.label === "Resume" ? (
                    <span
                      className="small-caps absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-bold"
                      style={{ background: `${mode.contrast}22` }}
                    >
                      Resume
                    </span>
                  ) : (
                    <span
                      className="absolute bottom-6 right-6 font-condensed text-3xl font-semibold leading-none opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-90"
                      aria-hidden
                    >
                      →
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quiet footer */}
        <div className="mt-7 flex items-center justify-center gap-5 text-xs font-semibold text-ink-secondary">
          <Link href="/leaderboard" className="transition-colors hover:text-ink">
            Leaderboard
          </Link>
          <span className="text-border">·</span>
          <Link href="/archive" className="transition-colors hover:text-ink">
            Past games
          </Link>
          <span className="text-border">·</span>
          <Link href="/about" className="transition-colors hover:text-ink">
            About
          </Link>
        </div>
      </div>
    </main>
  );
}
