import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayExperience } from "@/components/game/PlayExperience";
import { GameSeoFooter } from "@/components/seo/GameSeoFooter";
import { getFullGame, getGameMeta, getGameNumber } from "@/lib/games";
import { puzzleDescription, puzzleTitle } from "@/lib/seo";
import { isValidISODate, todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const meta = await getGameMeta(date);
  if (!meta) return { title: "Game not found" };
  const title = puzzleTitle(meta);
  const description = puzzleDescription(meta);
  return {
    title,
    description,
    alternates: { canonical: `/play/${date}` },
    openGraph: { title, description, url: `/play/${date}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PlayDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();

  const [game, gameNumber] = await Promise.all([
    getFullGame(date),
    getGameNumber(date),
  ]);

  // Same experience as /play - isDaily just controls the midnight roll-over.
  return (
    <>
      <PlayExperience
        initialGame={game}
        date={date}
        gameNumber={gameNumber}
        isDaily={date === todayISO()}
      />
      {game && <GameSeoFooter game={game} date={date} />}
    </>
  );
}
