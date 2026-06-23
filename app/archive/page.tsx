import Link from "next/link";
import type { Metadata } from "next";
import { ArchiveCalendar } from "@/components/archive/ArchiveCalendar";
import { BrandMark } from "@/components/ui/Logo";
import { getPublishedGamesWithNumbers } from "@/lib/games";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Browse and replay every past WhoHadMore puzzle by date — a new daily comparison game across sports, pop culture, food, geography and science.",
  alternates: { canonical: "/archive" },
};

export default async function ArchivePage() {
  const games = await getPublishedGamesWithNumbers(todayISO());

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5">
          <BrandMark className="h-5 w-5" />
          <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
        </Link>
        <Link
          href="/"
          className="rounded-full bg-cta px-4 py-1.5 text-xs font-semibold text-white"
        >
          Today&apos;s game
        </Link>
      </header>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Archive</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {games.length} games and counting — pick any day to play.
        </p>
      </div>

      <ArchiveCalendar games={games} />
    </main>
  );
}
