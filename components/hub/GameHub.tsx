"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/ui/TopNav";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { formatDisplayDate } from "@/lib/date";
import { getLocalResult, getProgress, getSessionId } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { usePlayedResults } from "@/hooks/usePlayedResults";
import { chainDailyScore } from "@/lib/leaderboard";
import { LIVE_MODES, MODES } from "@/lib/modes";
import { useArchiveGate } from "@/hooks/useArchiveGate";
import { ArchiveLock } from "@/components/games/ArchiveLock";
import { DayBoard } from "@/components/hub/DayBoard";
import { ShareResults } from "@/components/game/ShareResults";
import { todayISO } from "@/lib/date";
import { themeFor } from "@/lib/weekly";
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

/** Short scorecard line per game (the row is a ledger, not an ad). */
const ROW_TAG: Record<string, string> = {
  chain: "Tap whichever is higher",
  duality: "Four hidden pairs",
  word: "Five letters, six tries",
  mini: "A 5×5 crossword",
};

/** Gold star, stamped over a finished row. */
function StarStamp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M 50 8 L 61 36 L 92 38 L 68 58 L 76 90 L 50 71 L 24 90 L 32 58 L 8 38 L 39 36 Z"
        fill="#FFB300"
        stroke="#16181D"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The daily hub, games-first: a thin header, the date, then each game as a
 * big solid-color block whose wordmark is the hero. No icons in boxes, no
 * marketing copy - the cards ARE the page.
 */
export function GameHub({ game, date, gameNumber }: GameHubProps) {
  const [tiles, setTiles] = useState<Record<string, TileState>>({});
  // Server truth (account / session), so scores persist across sign-out/in and
  // devices - not just this device's localStorage.
  const serverChain = usePlayedResults();
  const [serverModes, setServerModes] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    fetch(`/api/modes/results?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { results?: Record<string, Record<string, number>> }) => setServerModes(d.results ?? {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const next: Record<string, TileState> = {};
    const chainServer = serverChain[date];
    const modeServer = serverModes[date] ?? {};
    for (const m of LIVE_MODES) {
      if (m.id === "chain") {
        const chain = getLocalResult(date) ?? chainServer ?? null;
        const prog = getProgress(date);
        if (chain) {
          const pts = chainDailyScore(chain.reached, chain.rounds);
          next.chain = { played: true, label: `${pts}`, score: pts };
        } else {
          next.chain = { played: false, label: prog && prog.roundsPlayed > 0 ? "Resume" : "Play", score: 0 };
        }
      } else {
        const local = getModeResult(m.id, date);
        const score = local ? local.score : modeServer[m.id];
        next[m.id] =
          typeof score === "number"
            ? { played: true, label: `${score}`, score }
            : { played: false, label: "Play", score: 0 };
      }
    }
    setTiles(next);
  }, [date, serverChain, serverModes]);

  const playedCount = LIVE_MODES.filter((m) => tiles[m.id]?.played).length;
  const total = LIVE_MODES.reduce((a, m) => a + (tiles[m.id]?.score ?? 0), 0);
  const isToday = date === todayISO();
  const { locked, checking } = useArchiveGate(date);

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
        {/* The card's masthead: crooked date stamp, title, running total */}
        <div className="mt-7 text-center">
          <span className="stamp-red">
            {isToday ? "" : "Archive · "}
            {formatDisplayDate(date)} · Card No. {gameNumber}
          </span>
          <h1 className="mt-3 font-condensed text-4xl font-semibold uppercase leading-none tracking-wide text-ink">
            {isToday ? "Today's card" : "That day's card"}
          </h1>
          <p className="mt-2.5 font-condensed text-lg font-semibold text-ink">
            Running total: <span className="marker-gold tabular">{total.toLocaleString("en-US")} pts</span>
            <span className="text-ink-secondary"> · {playedCount}/{LIVE_MODES.length}</span>
          </p>
        </div>

        {checking && !isToday ? (
          <div className="min-h-[40vh]" aria-hidden />
        ) : locked ? (
          <ArchiveLock date={date} />
        ) : (
        <>
        {/* The ledger: one printed row per game, filled in as you play */}
        <div className="mt-6 flex flex-col gap-[15px]">
          {MODES.map((mode, i) => {
            const t = tiles[mode.id];
            const played = t?.played ?? false;
            const soon = mode.status === "soon";
            const tilt = i % 2 === 0 ? "tilt-l" : "tilt-r";

            if (soon) {
              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className={`card-ink-flat relative rounded-[14px] px-4 py-4 opacity-60 ${tilt}`}
                >
                  <GameWordmark mode={mode.id} className="text-2xl text-ink" alt={mode.accent} />
                  <span className="small-caps absolute right-4 top-4 text-[10px] font-bold text-ink-secondary">
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
                className={tilt}
              >
                <Link
                  href={mode.href(date)}
                  className="card-ink group relative flex items-center gap-3.5 rounded-[14px] py-[15px] pl-5 pr-4 transition-transform duration-100 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <span
                    className="absolute bottom-2.5 left-0 top-2.5 w-1.5 rounded-r-full"
                    style={{ background: mode.accent }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <GameWordmark mode={mode.id} className="text-[26px] text-ink" alt={mode.accent} />
                    <span className="mt-0.5 block truncate text-[11px] font-bold text-ink-secondary">
                      {mode.id === "chain" ? themeFor(date).name : ROW_TAG[mode.id]}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {played ? (
                      <span className="font-condensed text-[26px] font-semibold leading-none text-ink tabular">
                        {t.label}
                      </span>
                    ) : t?.label === "Resume" ? (
                      <span className="blank-box flex h-[34px] items-center px-3 text-[10px] font-bold uppercase tracking-[0.08em]">
                        Resume
                      </span>
                    ) : (
                      <span className="blank-box flex h-[34px] w-[62px] items-center justify-center text-[10px] font-bold uppercase tracking-[0.08em]">
                        — pts
                      </span>
                    )}
                  </span>
                  {played && <StarStamp className="absolute -right-2.5 -top-3.5 h-[34px] w-[34px] rotate-12" />}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* All four done - invite a share (the growth loop) */}
        {playedCount === LIVE_MODES.length && (
          <div className="mt-5">
            <ShareResults date={date} />
          </div>
        )}

        {!isToday && <DayBoard date={date} />}

        {/* Quiet footer, set like the card's fine print */}
        <div className="small-caps mt-8 flex items-center justify-center gap-5 text-[10px] font-bold text-ink-secondary">
          <Link href="/leaderboard" className="transition-colors hover:text-ink">
            Leaderboard
          </Link>
          <span aria-hidden>·</span>
          <Link href="/archive" className="transition-colors hover:text-ink">
            Past cards
          </Link>
          <span aria-hidden>·</span>
          <Link href="/about" className="transition-colors hover:text-ink">
            About
          </Link>
        </div>
        </>
        )}
      </div>
    </main>
  );
}
