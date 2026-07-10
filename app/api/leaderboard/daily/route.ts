import { NextResponse } from "next/server";
import { isValidISODate, todayISO } from "@/lib/date";
import { getDailyLeaderboard } from "@/lib/dailyLeaderboard";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/daily?date=YYYY-MM-DD&session=<id>
// Everyone who played that day's game (signed in or not), ranked by how far
// they got, then who was fastest. Profile-less players show as "Anonymous".
// Scoped to one date, so it naturally resets when the daily game rolls over.
//
// `configured` in the response tells you whether a backend is even wired up:
// when it's false the deployment is in demo mode (Supabase env vars missing for
// this environment) and the board will always be empty.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const param = url.searchParams.get("date");
  const viewer = url.searchParams.get("session");
  const date = param && isValidISODate(param) ? param : todayISO();

  const result = await getDailyLeaderboard(date, viewer);
  return NextResponse.json({ date, ...result });
}
