import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isValidISODate } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/mockGame";

export const dynamic = "force-dynamic";

// A parking date no real game will ever use, so we can swap two games past the
// unique(play_date) constraint without a transaction.
const TEMP_DATE = "0001-01-01";

// POST { from, to } — move a game to another day. If `to` already has a game,
// the two games swap dates. Note: game_results are keyed by date, so they stay
// with the day, not the game (fine for rescheduling drafts / future games).
export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  let body: { from?: string; to?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { from, to } = body;
  if (!from || !to || !isValidISODate(from) || !isValidISODate(to)) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ ok: true, swapped: false });
  }

  const supabase = getServiceSupabase();

  const { data: source } = await supabase
    .from("daily_games")
    .select("id")
    .eq("play_date", from)
    .maybeSingle<{ id: string }>();
  if (!source) {
    return NextResponse.json({ error: "No game on the day you moved." }, { status: 404 });
  }

  const { data: target } = await supabase
    .from("daily_games")
    .select("id")
    .eq("play_date", to)
    .maybeSingle<{ id: string }>();

  // Empty target — straight move.
  if (!target) {
    const { error } = await supabase
      .from("daily_games")
      .update({ play_date: to })
      .eq("id", source.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, swapped: false });
  }

  // Occupied target — swap via the parking date.
  const park = await supabase.from("daily_games").update({ play_date: TEMP_DATE }).eq("id", source.id);
  if (park.error) return NextResponse.json({ error: park.error.message }, { status: 500 });

  const moveTarget = await supabase.from("daily_games").update({ play_date: from }).eq("id", target.id);
  if (moveTarget.error) {
    // Roll the source back out of the parking date.
    await supabase.from("daily_games").update({ play_date: from }).eq("id", source.id);
    return NextResponse.json({ error: moveTarget.error.message }, { status: 500 });
  }

  const moveSource = await supabase.from("daily_games").update({ play_date: to }).eq("id", source.id);
  if (moveSource.error) return NextResponse.json({ error: moveSource.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, swapped: true });
}
