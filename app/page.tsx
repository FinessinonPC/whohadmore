import type { Metadata } from "next";
import { GameHub } from "@/components/hub/GameHub";
import { SiteSeoFooter } from "@/components/seo/SiteSeoFooter";
import { getFullGame, getGameNumber } from "@/lib/games";
import { todayISO } from "@/lib/date";
import { finishedCardScores } from "@/lib/finishedCard";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "WhoHadMore is a free set of quick daily puzzles - Chain, Duality, Word, and the Mini crossword - with one combined score and a daily leaderboard. New games every midnight.";

// The share card's URL must change when the DAY changes. Next's file-based
// opengraph-image emits a build-time content hash (/opengraph-image?ab61...),
// which is identical every day - so iMessage, WhatsApp, Slack and friends fetch
// it once, cache it by URL, and keep showing a stale puzzle number until the
// next deploy. Stamping today's date into the query string gives every day a
// distinct URL, which busts those caches exactly once per day.
export async function generateMetadata(): Promise<Metadata> {
  const date = todayISO();
  const image = {
    url: `/opengraph-image?d=${date}`,
    width: 1200,
    height: 630,
    alt: "WhoHadMore - today's daily puzzles",
  };
  return {
    title: { absolute: "WhoHadMore - 4 Quick Daily Puzzles" },
    description: DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "WhoHadMore",
      title: "WhoHadMore - 4 Quick Daily Puzzles",
      description: DESCRIPTION,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: "WhoHadMore - 4 Quick Daily Puzzles",
      description: DESCRIPTION,
      images: [image],
    },
  };
}

// The homepage is the daily hub: today's topic, three ways to play it, one
// combined total. Content lives at the root for SEO.
export default async function HomePage() {
  const date = todayISO();
  const [game, gameNumber] = await Promise.all([getFullGame(date), getGameNumber(date)]);
  // Resolve the card server-side so a finished card renders finished in the
  // first byte, instead of the browser correcting the page a moment later.
  const finished = await finishedCardScores(date, Math.max(1, (game?.cards.length ?? 0) - 1));

  return (
    <>
      {/* The games own the first screen. Wrapping the hub in a full-viewport
          block keeps the SEO copy below the fold on every device - it's there
          for crawlers and curious readers, not competing with the game. */}
      <div className="flex min-h-fold flex-col">
        <GameHub game={game} date={date} gameNumber={gameNumber} initialScores={finished} />
      </div>
      <SiteSeoFooter />
    </>
  );
}
