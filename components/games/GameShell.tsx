"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/ui/Logo";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { getLocalResult } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { LIVE_MODES, modeDef, type ModeId } from "@/lib/modes";
import { useArchiveGate } from "@/hooks/useArchiveGate";
import { ArchiveLock } from "./ArchiveLock";
import { ShareResults } from "@/components/game/ShareResults";
import { isAdminPreview } from "@/lib/adminClient";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "@/components/game/Fireworks";

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
      }`}
    >
      {isJuly4th(date) && <Fireworks />}
      <header className="relative z-[46] flex items-center justify-between">
        <Link href="/" aria-label="Back to today's games">
          <BrandLockup />
        </Link>
        <span style={{ color: def.accent }}>
          <GameWordmark mode={mode} className="text-xl" />
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
  const [next, setNext] = useState<ModeId | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unplayed = LIVE_MODES.filter((m) => {
      if (m.id === current) return false;
      if (m.id === "chain") return !getLocalResult(date);
      return !getModeResult(m.id, date);
    });
    setNext(unplayed[0]?.id ?? null);
    setChecked(true);
  }, [date, current]);

  if (!checked) return <span className="block h-14" aria-hidden />;

  if (next) {
    const def = modeDef(next);
    return (
      <div className="flex flex-col gap-2.5">
        <Link
          href={def.href(date)}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold transition-transform active:scale-[0.98]"
          style={{ background: def.accent, color: def.contrast }}
        >
          <span className="text-sm font-semibold opacity-75">Next up</span>
          <GameWordmark mode={next} className="text-2xl" />
        </Link>
        <Link
          href="/"
          className="py-1 text-center text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
        >
          Back to today&apos;s games
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-center text-sm font-bold text-ink">That&apos;s all four - nice.</p>
      <ShareResults date={date} />
      <Link
        href="/leaderboard"
        className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface text-sm font-bold text-ink transition-colors hover:bg-border/40"
      >
        See today&apos;s leaderboard
      </Link>
      <Link
        href="/"
        className="py-1 text-center text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
      >
        Back to today&apos;s games
      </Link>
    </div>
  );
}
