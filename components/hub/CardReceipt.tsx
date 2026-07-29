"use client";

import Link from "next/link";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { LIVE_MODES, modeDef } from "@/lib/modes";

/**
 * A finished card, compressed to a filled-in scorecard.
 *
 * Before you play, the four rows are a MENU - big, coloured, tappable, and
 * correctly the loudest thing on the page. Once every one is done they stop
 * being a menu and become a RECORD, and a record should be dense. Same scores,
 * same colours, still opens each finished board, about a fifth of the height -
 * which is what buys room for the countdown and the deal without scrolling.
 */
export function CardReceipt({
  date,
  label,
  scores,
}: {
  date: string;
  label: string;
  scores: Record<string, number>;
}) {
  return (
    <div className="card-ink tilt-l px-4 py-3.5">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="small-caps min-w-0 truncate text-[10px] font-bold text-ink-secondary">{label}</span>
        <span className="small-caps shrink-0 text-[9px] font-bold text-ink-secondary">Tap to look back</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {LIVE_MODES.map((m) => (
          <Link
            key={m.id}
            href={m.href(date)}
            aria-label={`Look back at ${m.name}`}
            className="wonky flex flex-col items-center gap-1 border-2 border-ink py-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: m.pastel }}
          >
            <span className="ink-fix">
              <GameWordmark mode={m.id} className="h-[13px] text-ink" alt={modeDef(m.id).accent} />
            </span>
            <span className="ink-fix tabular font-condensed text-[17px] font-semibold leading-none text-ink">
              {(scores[m.id] ?? 0).toLocaleString()}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
