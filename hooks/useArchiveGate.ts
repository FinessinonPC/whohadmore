"use client";

import { useProfile } from "@/hooks/useProfile";
import { todayISO } from "@/lib/date";
import { isFreeArchiveDate } from "@/lib/archiveWindow";

/**
 * Archived days are a signed-in perk, with a rolling window of recent ones
 * free to everyone.
 *
 * The window exists because a walled page cannot be a search result - it
 * offers a stranger a signup form instead of a puzzle - so every day page had
 * to be noindexed, which cost the site the one asset it has that grows by
 * itself. Opening the recent fortnight buys that surface back while leaving
 * the deep archive as the reason to make an account.
 *
 * `checking` covers the profile fetch so gated pages don't flash
 * locked/unlocked. Free dates skip it entirely - there is nothing to wait for
 * when the answer cannot depend on who you are.
 */
export function useArchiveGate(date: string): { locked: boolean; checking: boolean } {
  const { profile, loading } = useProfile();
  if (isFreeArchiveDate(date, todayISO())) return { locked: false, checking: false };
  return { locked: !loading && !profile?.username, checking: loading };
}
