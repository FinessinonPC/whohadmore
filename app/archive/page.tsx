import Link from "next/link";
import { ArchiveBrowser } from "@/components/archive/ArchiveBrowser";
import { getPublishedGamesWithNumbers } from "@/lib/games";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  // Oldest-first with game numbers; show newest first.
  const games = (await getPublishedGamesWithNumbers(todayISO())).reverse();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm font-extrabold tracking-tight text-ink">
          WhoHadMore
        </Link>
        <Link
          href="/play"
          className="rounded-full bg-cta px-4 py-1.5 text-xs font-semibold text-white"
        >
          Today&apos;s game
        </Link>
      </header>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Archive</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Every game so far. {games.length} total.
        </p>
      </div>

      <ArchiveBrowser games={games} />
    </main>
  );
}
