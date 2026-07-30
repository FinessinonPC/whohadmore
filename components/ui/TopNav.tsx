"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { BrandLockup } from "./Logo";
import { AccountButton } from "./AccountButton";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Shared top bar: the brand on the left; Past cards, Leaderboard and the
 * account on the right. The brand always returns to the daily home page.
 *
 * Both nav links survive to phone width, and they're set in full ink rather
 * than secondary - the archive is the best reason an anonymous player has to
 * make an account, and the board is the reason to come back. The space comes
 * from the theme toggle, which is desktop-only here and lives on the profile
 * page for phones: changing theme is a once-ever decision, and it was taking a
 * permanent slot from two things people press every day.
 *
 * (/games is an SEO landing page, not somewhere a player wants to go mid-visit;
 * it keeps its internal links from the homepage footer instead of a nav slot.)
 */
export function TopNav() {
  const { profile } = useProfile();

  return (
    <header className="flex shrink-0 items-center justify-between gap-2">
      <Link href="/" aria-label="Home" className="shrink-0">
        <BrandLockup />
      </Link>
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* The padding/negative-margin pair grows the tap target to ~36px
            without changing the bar's height - it's a 16px line of type, and
            on a phone this is now the main nav destination. */}
        <Link
          href="/archive"
          className="small-caps -my-2.5 whitespace-nowrap py-2.5 text-[10.5px] font-bold text-ink transition-colors hover:text-ink-secondary"
        >
          Past cards
        </Link>
        {/* Below 360px (iPhone SE 1) the wordmark, both links and the account
            chip genuinely don't fit; Past cards is the one that earns the slot. */}
        <Link
          href="/leaderboard"
          className="small-caps -my-2.5 hidden whitespace-nowrap py-2.5 text-[10.5px] font-bold text-ink transition-colors hover:text-ink-secondary min-[360px]:inline"
        >
          Board
        </Link>
        <span className="hidden sm:inline-flex">
          <ThemeToggle />
        </span>
        <AccountButton />
      </div>
    </header>
  );
}
