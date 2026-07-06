import type { Metadata } from "next";
import { GameHub } from "@/components/hub/GameHub";
import { GameSeoFooter } from "@/components/seo/GameSeoFooter";
import { getFullGame, getGameNumber } from "@/lib/games";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "WhoHadMore is a free daily higher-or-lower game hub: one topic, three quick games - Higher or Lower, Rank Five, and Pinpoint - one combined score. A new puzzle every day across sports, pop culture, food, geography and science.";

export const metadata: Metadata = {
  title: { absolute: "WhoHadMore - Daily Higher or Lower Games" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "WhoHadMore",
    title: "WhoHadMore - Daily Higher or Lower Games",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "WhoHadMore - Daily Higher or Lower Games",
    description: DESCRIPTION,
  },
};

// The homepage is the daily hub: today's topic, three ways to play it, one
// combined total. Content lives at the root for SEO.
export default async function HomePage() {
  const date = todayISO();
  const [game, gameNumber] = await Promise.all([
    getFullGame(date),
    getGameNumber(date),
  ]);

  return (
    <>
      <GameHub game={game} date={date} gameNumber={gameNumber} />
      {game && <GameSeoFooter game={game} date={date} />}
    </>
  );
}
