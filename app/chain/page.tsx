import type { Metadata } from "next";
import { PlayExperience } from "@/components/game/PlayExperience";
import { ChainGate } from "@/components/games/ChainGate";
import { getFullGame, getGameNumber } from "@/lib/games";
import { gameSeo } from "@/lib/gameSeo";
import { GameBelowFold } from "@/components/seo/GameBelowFold";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * /chain - today's Chain, playable on arrival.
 *
 * This is the page that has to win "chain whohadmore". It renders the game
 * itself rather than redirecting, because a redirect cannot rank: Google
 * indexes the destination, and the dated routes are noindexed as duplicates.
 * A searcher looking for the game lands on the game, not on an explainer and
 * not on a card from three weeks ago.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = gameSeo("chain");
  const title = seo?.seoTitle ?? "Chain";
  const description = seo?.metaDescription ?? "Play today's Chain on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: "/chain" },
    openGraph: { title, description, url: "/chain" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ChainTodayPage() {
  const date = todayISO();
  const [game, gameNumber] = await Promise.all([getFullGame(date), getGameNumber(date)]);

  return (
    <>
      <ChainGate date={date} isDaily>
        <PlayExperience initialGame={game} date={date} gameNumber={gameNumber} isDaily />
      </ChainGate>
      <GameBelowFold id="chain" />
    </>
  );
}
