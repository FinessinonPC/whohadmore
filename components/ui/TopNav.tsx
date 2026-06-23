"use client";

import Link from "next/link";
import { BrandMark } from "./Logo";
import { AccountButton } from "./AccountButton";
import { ThemeToggle } from "./ThemeToggle";

/** Shared top bar: brand on the left, Archive + theme + account on the right. */
export function TopNav() {
  return (
    <header className="flex shrink-0 items-center justify-between">
      <Link href="/" className="inline-flex items-center gap-1.5">
        <BrandMark className="h-5 w-5" />
        <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/archive"
          className="text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
        >
          Archive
        </Link>
        <ThemeToggle />
        <AccountButton />
      </div>
    </header>
  );
}
