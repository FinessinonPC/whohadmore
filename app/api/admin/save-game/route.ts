import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isValidISODate } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/mockGame";
import type { SaveGamePayload } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set the environment variables to save games." },
      { status: 503 }
    );
  }

  let payload: SaveGamePayload;
  try {
    payload = (await req.json()) as SaveGamePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidISODate(payload.play_date)) {
    return NextResponse.json({ error: "Invalid play_date" }, { status: 400 });
  }
  if (!payload.topic_label?.trim() || !payload.stat_label?.trim()) {
    return NextResponse.json(
      { error: "Topic label and stat label are required" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // Upsert the game row (play_date is unique).
  const { data: game, error: gameError } = await supabase
    .from("daily_games")
    .upsert(
      {
        play_date: payload.play_date,
        topic_label: payload.topic_label.trim(),
        topic_category: payload.topic_category,
        stat_label: payload.stat_label.trim(),
        stat_unit: payload.stat_unit?.trim() || null,
        published: Boolean(payload.published),
      },
      { onConflict: "play_date" }
    )
    .select("id")
    .single<{ id: string }>();

  if (gameError || !game) {
    return NextResponse.json(
      { error: gameError?.message ?? "Failed to save game" },
      { status: 500 }
    );
  }

  // Replace the card set wholesale — simplest correct approach for an editor.
  const validCards = (payload.cards ?? [])
    .filter((c) => c.entity_name?.trim() && Number.isFinite(Number(c.stat_value)))
    .map((c, index) => ({
      game_id: game.id,
      position: index,
      entity_name: c.entity_name.trim(),
      stat_value: Number(c.stat_value),
      image_url: c.image_url || null,
      image_source: c.image_source || null,
    }));

  const { error: deleteError } = await supabase
    .from("game_cards")
    .delete()
    .eq("game_id", game.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (validCards.length > 0) {
    const { error: insertError } = await supabase.from("game_cards").insert(validCards);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, game_id: game.id, cards: validCards.length });
}
