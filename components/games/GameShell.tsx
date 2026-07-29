"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/ui/Logo";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { getLocalResult } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { LIVE_MODES, modeDef, type ModeId } from "@/lib/modes";
import { formatShortDate, todayISO } from "@/lib/date";
import { useArchiveGate } from "@/hooks/useArchiveGate";
import { ArchiveLock } from "./ArchiveLock";
import { ShareResults } from "@/components/game/ShareResults";
import { ResultsModal } from "@/components/game/ResultsModal";
import { isAdminPreview } from "@/lib/adminClient";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "@/components/game/Fireworks";

/** The card a game belongs to: today's hub, or that day's. */
function hubHref(date: string): string {
  return date === todayISO() ? "/" : `/day/${date}`;
}

/**
 * Shared scaffold for every quick game: identical header (brand home link +
 * accent game chip), width, and festive layer - so each new game only worries
 * about its board. Keeps the whole collection feeling like one product.
 */
export function GameShell({
  mode,
  date,
  wide = false,
  children,
}: {
  mode: ModeId;
  date: string;
  /** Let the game use more width on desktop (e.g. the Mini's grid + clue list). */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const def = modeDef(mode);
  const isToday = date === todayISO();
  const gate = useArchiveGate(date);
  // Admins previewing from the panel bypass the sign-in wall entirely.
  const [preview, setPreview] = useState(false);
  useEffect(() => setPreview(isAdminPreview()), []);
  const locked = preview ? false : gate.locked;
  const checking = preview ? false : gate.checking;
  return (
    <main
      className={`mx-auto flex min-h-dvh w-full flex-col px-5 pb-10 pt-5 ${
        wide ? "max-w-game lg:max-w-[880px]" : "max-w-game"
      } ${isToday ? "" : "stock-archive"}`}
    >
      {isJuly4th(date) && <Fireworks />}
      <header className="relative z-[46] flex items-center justify-between gap-2">
        {/* Back to the card this game belongs to. It used to be hardcoded to
            "/", so finishing an archived game dropped you on today with no way
            back to the card you were working through. */}
        <Link href={hubHref(date)} aria-label={isToday ? "Back to today's games" : "Back to this card"}>
          <BrandLockup compact />
        </Link>
        <span className="flex min-w-0 items-center gap-2.5">
          {!isToday && (
            <span className="stamp-archive shrink-0">Archive · {formatShortDate(date)}</span>
          )}
          <span className="text-ink">
            <GameWordmark mode={mode} className="text-xl" alt={def.accent} />
          </span>
        </span>
      </header>
      <div className="relative z-[46] mt-6 flex flex-1 flex-col">
        {checking ? (
          <div className="min-h-[40vh]" aria-hidden />
        ) : locked ? (
          <ArchiveLock date={date} />
        ) : (
          children
        )}
      </div>
    </main>
  );
}

/**
 * After finishing a game, pull the player straight into the next unplayed one -
 * the loop that turns one quick session into all of today's games. Falls back
 * to the hub (and leaderboard) once everything's done.
 */
export function NextGameCTA({ date, current }: { date: string; current: ModeId }) {
  const isToday = date === todayISO();
  const [next, setNext] = useState<ModeId | null>(null);
  const [checked, setChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unplayed = LIVE_MODES.filter((m) => {
      if (m.id === current) return false;
      if (m.id === "chain") return !getLocalResult(date);
      return !getModeResult(m.id, date);
    });
    const nextId = unplayed[0]?.id ?? null;
    setNext(nextId);
    setChecked(true);

    // Finishing the fourth game pops the results pop-up - once per day, per
    // device (never during an admin preview).
    // Today only: an archived card hands off through its own hub, which knows
    // about the run and offers the next card. Two "what next" surfaces at once
    // is how a run starts feeling like a maze.
    if (nextId === null && date === todayISO() && !isAdminPreview()) {
      const key = `whohadmore:resultsModal:${date}`;
      try {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "1");
          setShowModal(true);
        }
      } catch {
        /* private mode - just skip the one-time guard */
      }
    }
  }, [date, current]);

  if (!checked) return <span className="block h-14" aria-hidden />;

  if (next) {
    const def = modeDef(next);
    return (
      <div className="flex flex-col gap-2.5">
        <Link
          href={def.href(date)}
          className="card-pastel tilt-l flex h-14 w-full items-center justify-center gap-2.5 text-base font-bold text-ink transition-all hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          style={{ background: def.pastel }}
        >
          <span className="small-caps text-[10px] font-bold text-ink-secondary">Next up</span>
          <GameWordmark mode={next} className="text-2xl text-ink" alt={def.accent} />
        </Link>
        <Link
          href={hubHref(date)}
          className="small-caps py-1 text-center text-[10px] font-bold text-ink-secondary transition-colors hover:text-ink"
        >
          {isToday ? "Back to today's card" : "Back to this card"}
        </Link>
      </div>
    );
  }

  return (
    <>
      {showModal && <ResultsModal date={date} onClose={() => setShowModal(false)} />}
      <div className="flex flex-col gap-2.5">
        <p className="text-center font-condensed text-lg font-semibold uppercase tracking-wide text-ink">
          Card complete <span className="marker-gold">- nice.</span>
        </p>
        <ShareResults date={date} surface="card_complete" />
        {/* On an archived card the loud button is the way BACK to that card -
            its hub has the receipt, that day's board, and the next card. */}
        <Link
          href={hubHref(date)}
          className={
            isToday
              ? "card-ink-flat flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-ink transition-colors hover:bg-border/30"
              : "ink-fix wonky flex h-14 w-full items-center justify-center border-2 border-ink bg-[#F8E6A2] text-[15px] font-bold text-ink ink-shadow-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          }
        >
          {isToday ? "See today's leaderboard" : "Back to this card →"}
        </Link>
        <Link
          href={isToday ? "/" : "/"}
          className="small-caps py-1 text-center text-[10px] font-bold text-ink-secondary transition-colors hover:text-ink"
        >
          {isToday ? "Back to today's card" : "Back to today"}
        </Link>
      </div>
    </>
  );
}
