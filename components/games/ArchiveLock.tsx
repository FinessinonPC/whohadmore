"use client";

import Link from "next/link";
import { formatDisplayDate } from "@/lib/date";

/**
 * The sign-in wall for archived days. Free accounts unlock every past day's
 * games - the nudge that turns anonymous players into named ones.
 */
export function ArchiveLock({ date }: { date: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <div className="card-ink tilt-l w-full max-w-sm rounded-2xl px-6 py-8">
        <span className="stamp-red">Players only · {formatDisplayDate(date)}</span>
        <h2 className="mt-4 font-condensed text-4xl font-semibold uppercase tracking-wide text-ink">
          Past cards are a player perk
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-secondary">
          Sign in with a free account to replay any day in the archive and get on
          that day&apos;s leaderboard.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2.5">
          <Link
            href="/profile"
            className="ink-shadow-sm flex h-14 w-full items-center justify-center rounded-xl border-[3px] border-ink bg-cta text-base font-bold text-background transition-all hover:opacity-95 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            Sign in free
          </Link>
          <Link
            href="/"
            className="small-caps py-1 text-center text-[10px] font-bold text-ink-secondary transition-colors hover:text-ink"
          >
            Play today&apos;s card instead
          </Link>
        </div>
      </div>
    </div>
  );
}
