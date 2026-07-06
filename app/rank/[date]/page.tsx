import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RankGame } from "@/components/games/RankGame";
import { getFullGame } from "@/lib/games";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const game = await getFullGame(date);
  if (!game) return { title: "Game not found" };
  const title = `Rank Five: ${game.topic_label}`;
  const description = `Put five cards from "${game.topic_label}" in order, highest to lowest. Part of WhoHadMore's free daily games.`;
  return {
    title,
    description,
    alternates: { canonical: `/rank/${date}` },
    openGraph: { title, description, url: `/rank/${date}` },
  };
}

export default async function RankPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  const game = await getFullGame(date);
  if (!game || game.cards.length < 3) notFound();

  return <RankGame game={game} date={date} />;
}
