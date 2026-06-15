import { notFound } from "next/navigation";
import { GameScreen } from "@/components/game/GameScreen";
import { isValidISODate, todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function PlayDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();

  // Same game component as /play — archive flag just changes the framing.
  return <GameScreen date={date} isArchive={date !== todayISO()} />;
}
