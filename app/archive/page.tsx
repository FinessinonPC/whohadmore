import Link from "next/link";
import { ArchiveBrowser } from "@/components/archive/ArchiveBrowser";
import { getServerSupabase } from "@/lib/supabase";
import { todayISO } from "@/lib/date";
import { buildMockGame, isSupabaseConfigured } from "@/lib/mockGame";
import type { DailyGame } from "@/types";

export const dynamic = "force-dynamic";

async function getPublishedGames(): Promise<DailyGame[]> {
  const today = todayISO();

  if (!isSupabaseConfigured()) {
    // Demo fallback: surface today's mock game so the archive isn't empty.
    const { cards: _cards, ...game } = buildMockGame(today);
    return [game];
  }

  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("daily_games")
    .select("*")
    .eq("published", true)
    .lte("play_date", today)
    .order("play_date", { ascending: false })
    .returns<DailyGame[]>();

  return data ?? [];
}

export default async function ArchivePage() {
  const games = await getPublishedGames();

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

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Archive</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Every past game, always playable.
        </p>
      </div>

      <ArchiveBrowser games={games} />
    </main>
  );
}
