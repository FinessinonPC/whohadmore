"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { levelFromXp } from "@/lib/leaderboard";

/**
 * Top-right account affordance. "Sign up" when no username is claimed on this
 * device; a level + username chip once they have one. Both lead to the profile.
 */
export function AccountButton() {
  const { profile, loading } = useProfile();

  // Reserve space during load to avoid a layout shift.
  if (loading) return <span className="h-7 w-16" aria-hidden />;

  if (profile?.username) {
    return (
      <Link
        href="/profile"
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-xs font-bold text-ink transition-colors hover:bg-border/40"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
          {levelFromXp(profile.xp)}
        </span>
        <span className="max-w-[7rem] truncate">{profile.username}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      className="ink-shadow-sm whitespace-nowrap rounded-full border-[2.5px] border-ink bg-cta px-4 py-1.5 text-xs font-bold text-background transition-all hover:opacity-95 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      Sign up
    </Link>
  );
}
