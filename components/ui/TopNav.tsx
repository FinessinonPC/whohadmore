"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { BrandLockup } from "./Logo";
import { AccountButton } from "./AccountButton";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Shared top bar: brand on the left; Past cards, Leaderboard, theme and account
 * on the right. The brand always returns to the daily home page. (/games is
 * an SEO landing page, not somewhere a player wants to go mid-visit - it keeps
 * its internal links from the homepage footer instead of a nav slot.)
 *
 * Past cards is the one nav item that survives to phone width, and it's set in
 * full ink rather than secondary. The archive is the single best reason an
 * anonymous player has to make an account - every past day is free once you
 * sign in - so it gets to sit next to the sign-up button instead of hiding in
 * the fine print at the bottom of the card, which is where it used to live on
 * mobile (the desktop-only nav links meant phones had no archive link at all).
 */
export function TopNav() {
  const { profile } = useProfile();

  return (
    <header className="flex shrink-0 items-center justify-between gap-2">
      <Link href="/" aria-label="Home" className="shrink-0">
        <BrandLockup compact />
      </Link>
      <div className="flex items-center gap-3">
        {/* The padding/negative-margin pair grows the tap target to ~36px
            without changing the bar's height - it's a 16px line of type, and
            on a phone this is now the main nav destination. */}
        <Link
          href="/archive"
          className="small-caps -my-2.5 whitespace-nowrap py-2.5 text-[10.5px] font-bold text-ink transition-colors hover:text-ink-secondary"
        >
          Past cards
        </Link>
        <Link
          href="/leaderboard"
          className="small-caps hidden text-[10.5px] font-bold text-ink-secondary transition-colors hover:text-ink sm:inline"
        >
          Leaderboard
        </Link>
        <ThemeToggle />
        <AccountButton />
      </div>
    </header>
  );
}
