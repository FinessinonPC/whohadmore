import { PlayExperience } from "@/components/game/PlayExperience";
import { getFullGame, getGameNumber } from "@/lib/games";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function PlayTodayPage() {
  const date = todayISO();
  const [game, gameNumber] = await Promise.all([
    getFullGame(date),
    getGameNumber(date),
  ]);

  return (
    <PlayExperience initialGame={game} date={date} gameNumber={gameNumber} isDaily />
  );
}
