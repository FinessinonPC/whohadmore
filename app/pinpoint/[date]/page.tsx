import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PinpointGame } from "@/components/games/PinpointGame";
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
  const title = `Pinpoint: ${game.topic_label}`;
  const description = `Guess the exact ${game.stat_label.toLowerCase()} for cards from "${game.topic_label}" - the closer you land, the more you score. Part of WhoHadMore's free daily games.`;
  return {
    title,
    description,
    alternates: { canonical: `/pinpoint/${date}` },
    openGraph: { title, description, url: `/pinpoint/${date}` },
  };
}

export default async function PinpointPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  const game = await getFullGame(date);
  if (!game || game.cards.length < 2) notFound();

  return <PinpointGame game={game} date={date} />;
}
