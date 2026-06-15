import { GameScreen } from "@/components/game/GameScreen";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export default function PlayTodayPage() {
  return <GameScreen date={todayISO()} isArchive={false} />;
}
