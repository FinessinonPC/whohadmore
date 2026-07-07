"use client";

import { useProfile } from "@/hooks/useProfile";
import { todayISO } from "@/lib/date";

/**
 * Archived days are a signed-in perk: today is free for everyone, but any
 * past date requires a claimed username. `checking` covers the profile fetch
 * so gated pages don't flash locked/unlocked.
 */
export function useArchiveGate(date: string): { locked: boolean; checking: boolean } {
  const { profile, loading } = useProfile();
  const isToday = date === todayISO();
  if (isToday) return { locked: false, checking: false };
  return { locked: !loading && !profile?.username, checking: loading };
}
