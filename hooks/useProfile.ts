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

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    rank: null,
    loading: true,
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile?session_id=${getSessionId()}`);
      const data = (await res.json()) as { profile: Profile | null; rank: number | null };
      setState({ profile: data.profile ?? null, rank: data.rank ?? null, loading: false });
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

  return { ...state, reload: load, claim };
}
