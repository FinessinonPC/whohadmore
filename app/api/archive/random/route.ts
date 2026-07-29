import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { getPublishedGamesWithNumbers } from "@/lib/games";
import { todayISO } from "@/lib/date";
import { LIVE_MODES } from "@/lib/modes";

export const dynamic = "force-dynamic";

/** A day is finished when every live game on it has a recorded result. */
const GAMES_PER_CARD = LIVE_MODES.length;

export interface DealtCard {
  date: string;
  gameNumber: number;
  topicLabel: string;
  /** Days still available to deal after this one. */
  remaining: number;
}

/**
 * GET /api/archive/random?session=<id>&exclude=<iso,iso>
 *
 * Deals a random published day the player hasn't finished. Never today - the
 * point is to fill the wait for tomorrow, not hand back the card they just did.
 *
 * Untouched days are dealt first; once those run out it falls back to days that
 * were started and abandoned, so the deal keeps working right to the end of the
 * archive instead of dead-ending while playable games remain. A session with no
 * history simply gets any day, which is what the signed-out preview wants.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const session = url.searchParams.get("session");
  const exclude = new Set(
    (url.searchParams.get("exclude") ?? "").split(",").filter(Boolean)
  );

  const today = todayISO();
  exclude.add(today);

  try {
    const games = (await getPublishedGamesWithNumbers(today)).filter(
      (g) => !exclude.has(g.play_date)
    );
    if (games.length === 0) return NextResponse.json({ none: true });

    // How many of that day's games this session has on record.
    const playedCount = new Map<string, number>();
    if (session && isSupabaseConfigured()) {
      const supabase = getServiceSupabase();
      const [chain, modes] = await Promise.all([
        supabase
          .from("game_results")
          .select("play_date")
          .eq("session_id", session)
          .returns<{ play_date: string }[]>(),
        supabase
          .from("game_mode_results")
          .select("play_date")
          .eq("session_id", session)
          .returns<{ play_date: string }[]>(),
      ]);
      for (const r of [...(chain.data ?? []), ...(modes.data ?? [])]) {
        playedCount.set(r.play_date, (playedCount.get(r.play_date) ?? 0) + 1);
      }
    }

    const untouched = games.filter((g) => !playedCount.has(g.play_date));
    const unfinished = games.filter((g) => {
      const n = playedCount.get(g.play_date) ?? 0;
      return n > 0 && n < GAMES_PER_CARD;
    });

    const pool = untouched.length > 0 ? untouched : unfinished;
    if (pool.length === 0) return NextResponse.json({ none: true });

    const pick = pool[Math.floor(Math.random() * pool.length)];
    const card: DealtCard = {
      date: pick.play_date,
      gameNumber: pick.game_number,
      topicLabel: pick.topic_label,
      // What's left AFTER this one, so the copy can say "57 still waiting".
      remaining: Math.max(0, untouched.length + unfinished.length - 1),
    };
    return NextResponse.json({ card });
  } catch (e) {
    console.error("[archive/random] deal failed:", e);
    return NextResponse.json({ none: true });
  }
}
