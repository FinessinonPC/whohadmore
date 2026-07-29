import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * POST /api/profile/restore  { session_id, play_date, reached, rounds }
 *
 * Put back a Chain row this device has and the server doesn't - and touch
 * NOTHING else. No points, no streak, no achievements, no profile write.
 *
 * That restriction is the entire point. Profile totals are accumulated as games
 * are played, so a player's stored total still contains the points from a row
 * that has since gone missing. Replaying the result through the normal
 * completion route would add those points a second time and inflate them.
 * Restoring the row alone leaves the totals exactly as they are - correct
 * before, correct after - and simply makes the history match them again.
 *
 * Never overwrites: if a row already exists for that session and date, this is
 * a no-op, so it is safe to call repeatedly and safe to call on a device whose
 * copy is older than the server's.
 */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, restored: false });

  let body: { session_id?: string; play_date?: string; reached?: number; rounds?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { session_id, play_date } = body;
  const reached = Number(body.reached);
  const rounds = Number(body.rounds);

  if (
    !session_id ||
    !play_date ||
    !isValidISODate(play_date) ||
    !Number.isFinite(reached) ||
    !Number.isFinite(rounds) ||
    reached < 0 ||
    rounds < 1 ||
    rounds > 50 ||
    reached > rounds
  ) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();

    const { data: existing } = await supabase
      .from("game_results")
      .select("id")
      .eq("session_id", session_id)
      .eq("play_date", play_date)
      .maybeSingle<{ id: string }>();
    if (existing) return NextResponse.json({ ok: true, restored: false });

    const row = {
      play_date,
      session_id,
      score: Math.round(reached),
      lives_remaining: null,
      completed: true,
      time_seconds: 0,
      points: 0,
      stars: 0,
    };
    // `rounds` only exists once migration 0009 has run; retry without it rather
    // than lose the row over a column.
    const { error } = await supabase
      .from("game_results")
      .insert({ ...row, rounds: Math.round(rounds) });
    if (error) {
      const retry = await supabase.from("game_results").insert(row);
      if (retry.error) {
        console.error("[restore] insert failed:", retry.error.message);
        return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, restored: true });
  } catch (e) {
    console.error("[restore] failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
