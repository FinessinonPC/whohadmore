import type { Metadata } from "next";
import { PlayExperience } from "@/components/game/PlayExperience";
import { GameSeoFooter } from "@/components/seo/GameSeoFooter";
import { getFullGame, getGameNumber } from "@/lib/games";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "WhoHadMore is a free daily higher-or-lower game: two cards, one stat, tap whichever is higher. A new guessing puzzle every day across sports, pop culture, food, geography and science.";

export const metadata: Metadata = {
  title: { absolute: "WhoHadMore - Daily Higher or Lower Game" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "WhoHadMore",
    title: "WhoHadMore - Daily Higher or Lower Game",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "WhoHadMore - Daily Higher or Lower Game",
    description: DESCRIPTION,
  },
};

// The homepage IS today's game (content lives at the root for SEO).
export default async function HomePage() {
  const date = todayISO();
  const [game, gameNumber] = await Promise.all([
    getFullGame(date),
    getGameNumber(date),
  ]);

  return (
    <>
      <PlayExperience initialGame={game} date={date} gameNumber={gameNumber} isDaily />
      {game && <GameSeoFooter game={game} date={date} />}
    </>
  );
}
