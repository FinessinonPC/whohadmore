"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

export function ArchiveAuthGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-ink"></div>
      </div>
    );
  }

  if (!profile?.username) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="font-condensed text-3xl font-semibold uppercase tracking-wide text-ink">Archive Locked</h2>
        <p className="mt-2 text-ink-secondary">The archive is only available for players who are signed in.</p>
        <Link
          href="/profile"
          className="ink-shadow-sm wonky mt-6 border-2 border-ink bg-cta px-6 py-2.5 text-sm font-bold text-background transition-all hover:opacity-90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Sign in to unlock
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
