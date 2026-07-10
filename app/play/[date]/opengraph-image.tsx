import { getGameMeta, getGameNumber } from "@/lib/games";
import { isValidISODate } from "@/lib/date";
import { puzzleNumberCard, OG_SIZE } from "@/lib/shareCard";

export const alt = "WhoHadMore - a daily puzzle";
export const size = OG_SIZE;
export const contentType = "image/png";

// Per-puzzle share card: same puzzle-number hero as the site-wide card, with
// that day's topic as the subline so the link teases what's being compared.
export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;

  let gameNumber: number | null = null;
  let subline = "Four quick daily puzzles";
  if (isValidISODate(date)) {
    try {
      const [meta, number] = await Promise.all([getGameMeta(date), getGameNumber(date)]);
      gameNumber = number;
      const topic = meta?.topic_label?.trim();
      if (topic) subline = topic.length > 70 ? `${topic.slice(0, 67)}…` : topic;
    } catch {
      /* keep fallbacks */
    }
  }

  return puzzleNumberCard(gameNumber, subline);
}
