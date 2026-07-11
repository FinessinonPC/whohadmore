"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { BrandLockup } from "./Logo";
import { AccountButton } from "./AccountButton";
import { ThemeToggle } from "./ThemeToggle";

/** Shared top bar: brand on the left; Archive, Leaderboard, theme + account on
 *  the right. The brand always returns to the daily home page. */
export function TopNav() {
  const { profile } = useProfile();

  return (
    <header className="flex shrink-0 items-center justify-between">
      <Link href="/" aria-label="Home">
        <BrandLockup />
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/archive"
          className="small-caps hidden text-[10.5px] font-bold text-ink-secondary transition-colors hover:text-ink sm:inline"
        >
          Archive
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
