import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { GameHub } from "@/components/hub/GameHub";
import { GameSeoFooter } from "@/components/seo/GameSeoFooter";
import { getFullGame, getGameNumber } from "@/lib/games";
import { formatDisplayDate, isValidISODate, todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const game = await getFullGame(date);
  const title = game
    ? `${game.topic_label} - ${formatDisplayDate(date)}`
    : `Archive - ${formatDisplayDate(date)}`;
  const description = `Replay ${formatDisplayDate(date)} on WhoHadMore: that day's Chain, Duality, Word and Mini, plus the day's leaderboard.`;
  return {
    title,
    description,
    alternates: { canonical: `/day/${date}` },
    openGraph: { title, description, url: `/day/${date}` },
  };
}

// An archived day's hub: the same four-game homepage, pinned to that date,
// with that day's leaderboard. Today's date canonicalizes to the homepage.
export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  const today = todayISO();
  if (date === today) redirect("/");
  if (date > today) notFound();

  const [game, gameNumber] = await Promise.all([getFullGame(date), getGameNumber(date)]);

  return (
    <>
      <GameHub game={game} date={date} gameNumber={gameNumber} />
      {game && <GameSeoFooter game={game} date={date} />}
    </>
  );
}
