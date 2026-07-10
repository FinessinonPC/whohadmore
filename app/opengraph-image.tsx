import { getGameNumber } from "@/lib/games";
import { todayISO } from "@/lib/date";
import { puzzleNumberCard, OG_SIZE } from "@/lib/shareCard";

export const alt = "WhoHadMore - today's daily puzzles";
export const size = OG_SIZE;
export const contentType = "image/png";
// Re-render hourly so the puzzle number tracks the current day.
export const revalidate = 3600;

// The site-wide share card: today's puzzle number as the hero ("No. 43") -
// the thing people compare notes on - over the four-color diagonal wash.
export default async function OpengraphImage() {
  let gameNumber: number | null = null;
  try {
    gameNumber = await getGameNumber(todayISO());
  } catch {
    /* unconfigured/db hiccup - card falls back to "Every day" */
  }
  return puzzleNumberCard(gameNumber, "A new set of four puzzles drops at midnight");
}
