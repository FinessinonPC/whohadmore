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
      <p className="small-caps text-xs text-ink-secondary">{formatDisplayDate(date)}</p>
      <h2 className="mt-2 font-condensed text-4xl font-semibold uppercase tracking-wide text-ink">
        Past days are a player perk
      </h2>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-secondary">
        Sign in with a free account to replay any day in the archive and get on
        that day&apos;s leaderboard.
      </p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
        <Link
          href="/profile"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-cta text-base font-bold text-background transition-transform active:scale-[0.98]"
        >
          Sign in free
        </Link>
        <Link
          href="/"
          className="py-1 text-center text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
        >
          Play today&apos;s games instead
        </Link>
      </div>
    </div>
  );
}
