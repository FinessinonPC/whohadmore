import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { chainDailyScore } from "@/lib/leaderboard";
import { LIVE_MODES } from "@/lib/modes";

/** Mirror of the device's session id, written by lib/playStore so the SERVER
 *  can identify the player. The id itself is not a secret - it is the same one
 *  every /api call already takes as a query parameter. */
export const SESSION_COOKIE = "whm_sid";

/**
 * A card's scores for whoever is holding this browser, resolved server-side.
 *
 * Without this the hub could only learn what you'd played after two client
 * fetches had come back - so it painted the unfinished ledger first and
 * corrected itself a few hundred milliseconds later. On a device that has your
 * history only on the server (a new phone, a fresh browser, or the moment right
 * after signing in) that is every single visit, which is exactly the glitch:
 * old screen, then the finished one.
 *
 * Now the page asks the database directly and renders the right thing in its
 * first byte. Returns null unless EVERY game of that date is recorded, since a
 * partly-played card is just the ordinary ledger.
 *
 * `rounds` comes from the card the page has already loaded, so scoring the
 * Chain here needs no extra query.
 */
export async function finishedCardScores(
  date: string,
  rounds: number
): Promise<Record<string, number> | null> {
  if (!isSupabaseConfigured()) return null;

  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session || !/^[A-Za-z0-9_-]{8,64}$/.test(session)) return null;

  try {
    const supabase = getServiceSupabase();
    const [chainRes, modeRes] = await Promise.all([
      supabase
        .from("game_results")
        .select("score, rounds")
        .eq("session_id", session)
        .eq("play_date", date)
        .maybeSingle<{ score: number | null; rounds: number | null }>(),
      supabase
        .from("game_mode_results")
        .select("mode, score")
        .eq("session_id", session)
        .eq("play_date", date)
        .returns<{ mode: string; score: number | null }[]>(),
    ]);

    const scores: Record<string, number> = {};
    if (chainRes.data) {
      const r = chainRes.data.rounds && chainRes.data.rounds > 0 ? chainRes.data.rounds : rounds;
      scores.chain = chainDailyScore(chainRes.data.score ?? 0, r);
    }
    for (const row of modeRes.data ?? []) scores[row.mode] = row.score ?? 0;

    // Anything less than the full card is the ordinary ledger.
    return LIVE_MODES.every((m) => typeof scores[m.id] === "number") ? scores : null;
  } catch {
    // Never let this decide whether the page renders - worst case the hub
    // resolves on the client the way it always did.
    return null;
  }
}
