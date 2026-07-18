"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionId } from "@/lib/playStore";
import type { Profile } from "@/lib/leaderboard";

export interface LastGame {
  play_date: string;
  reached: number;
  rounds: number;
  lives?: number;
  time_seconds?: number;
}

interface ProfileState {
  profile: Profile | null;
  rank: number | null;
  loading: boolean;
}

// Module-level cache so navigating between tabs doesn't re-flash the account
// chip while it refetches. Persists across component remounts for the JS
// session; empty on the server so SSR/first-paint stays consistent.
let cache: { profile: Profile | null; rank: number | null } | null = null;

export function useProfile() {
  const [state, setState] = useState<ProfileState>(() =>
    cache ? { profile: cache.profile, rank: cache.rank, loading: false } : { profile: null, rank: null, loading: true }
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile?session_id=${getSessionId()}`);
      const data = (await res.json()) as { profile: Profile | null; rank: number | null };
      cache = { profile: data.profile ?? null, rank: data.rank ?? null };
      setState({ profile: cache.profile, rank: cache.rank, loading: false });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const claim = useCallback(
    async (username: string, lastGame?: LastGame): Promise<{ ok: boolean; error?: string }> => {
      const res = await fetch("/api/profile/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: getSessionId(), username, lastGame }),
      });
      const data = (await res.json()) as { profile?: Profile; error?: string };
      if (res.ok && data.profile) {
        await load();
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Couldn't save that username." };
    },
    [load]
  );

  /** Permanently delete the account server-side, then wipe this device's
   *  storage and reload from scratch (fresh anonymous session, caches gone). */
  const deleteAccount = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: getSessionId() }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error ?? "Couldn't delete your account - try again." };
      }
      cache = null;
      try {
        window.localStorage.clear(); // session id, results, and any auth tokens
      } catch {
        /* storage disabled - server data is gone regardless */
      }
      window.location.href = "/"; // full reload: fresh session, caches dropped
      return { ok: true };
    } catch {
      return { ok: false, error: "Couldn't reach the server - try again." };
    }
  }, []);

  return { ...state, reload: load, claim, deleteAccount };
}
