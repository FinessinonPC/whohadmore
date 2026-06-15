import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isValidISODate } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/mockGame";
import type { DailyGame, FullGame, GameCard } from "@/types";

export const dynamic = "force-dynamic";

// Full game for a date INCLUDING drafts — for the editor (service role bypasses
// the published-only RLS read policy).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  if (!isValidISODate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ game: null });
  }

  const supabase = getServiceSupabase();
  const { data: game, error } = await supabase
    .from("daily_games")
    .select("*")
    .eq("play_date", date)
    .maybeSingle<DailyGame>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!game) {
    return NextResponse.json({ game: null });
  }

  const { data: cards } = await supabase
    .from("game_cards")
    .select("*")
    .eq("game_id", game.id)
    .order("position", { ascending: true })
    .returns<GameCard[]>();

  const full: FullGame = { ...game, cards: cards ?? [] };
  return NextResponse.json({ game: full });
}
