import { notFound } from "next/navigation";
import { PlayExperience } from "@/components/game/PlayExperience";
import { getFullGame, getGameNumber } from "@/lib/games";
import { isValidISODate, todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

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

  // Same experience as /play — isDaily just controls the midnight roll-over.
  return (
    <PlayExperience
      initialGame={game}
      date={date}
      gameNumber={gameNumber}
      isDaily={date === todayISO()}
    />
  );
}
