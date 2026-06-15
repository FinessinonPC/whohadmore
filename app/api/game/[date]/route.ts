import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getWikimediaThumbnail } from "@/lib/wikimedia";
import { isValidISODate } from "@/lib/date";
import { buildMockGame, isSupabaseConfigured } from "@/lib/mockGame";
import type { DailyGame, FullGame, GameCard } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  if (!isValidISODate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // Fresh-clone fallback: no Supabase yet -> serve a fully playable mock,
  // enriching cards with live Wikimedia images so it looks like the real thing.
  if (!isSupabaseConfigured()) {
    const mock = buildMockGame(date);
    const withImages = await Promise.all(
      mock.cards.map(async (c) => ({
        ...c,
        image_url: await getWikimediaThumbnail(c.entity_name),
      }))
    );
    return NextResponse.json({ game: { ...mock, cards: withImages } });
  }

  const supabase = getServerSupabase();

  const { data: game, error } = await supabase
    .from("daily_games")
    .select("*")
    .eq("play_date", date)
    .eq("published", true)
    .maybeSingle<DailyGame>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!game) {
    return NextResponse.json({ game: null });
  }

  const { data: cards, error: cardsError } = await supabase
    .from("game_cards")
    .select("*")
    .eq("game_id", game.id)
    .order("position", { ascending: true })
    .returns<GameCard[]>();

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  const full: FullGame = { ...game, cards: cards ?? [] };
  return NextResponse.json({ game: full });
}
