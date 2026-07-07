"use client";

import Link from "next/link";
import { BrandLockup } from "@/components/ui/Logo";
import { useArchiveGate } from "@/hooks/useArchiveGate";
import { ArchiveLock } from "./ArchiveLock";

/**
 * Sign-in wall around the archived Chain game. Today's game passes straight
 * through; past dates require a claimed username, same as the other games.
 */
export function ChainGate({
  date,
  isDaily,
  children,
}: {
  date: string;
  isDaily: boolean;
  children: React.ReactNode;
}) {
  const { locked, checking } = useArchiveGate(date);
  if (isDaily) return <>{children}</>;
  if (checking || locked) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Home">
            <BrandLockup />
          </Link>
        </header>
        {checking ? <div className="min-h-[40vh]" aria-hidden /> : <ArchiveLock date={date} />}
      </main>
    );
  }
  return <>{children}</>;
}
