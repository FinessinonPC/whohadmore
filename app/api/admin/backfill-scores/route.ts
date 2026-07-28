import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { checkAdmin } from "@/lib/adminAuth";
import { monthPeriod, todayISO } from "@/lib/date";
import { applyRollup } from "@/lib/profileRollup";

export const dynamic = "force-dynamic";

// POST /api/admin/backfill-scores - recompute EVERY profile from its full game
// history using the same shared rollup every game-complete runs. Since live
// play, sign-in, and claiming all use that rollup too, profiles now stay
// correct on their own - this button is just "recompute everyone right now"
// (useful once after deploying a scoring change; harmless any other time).
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const today = todayISO();
  const period = monthPeriod(today);

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("session_id")
    .returns<{ session_id: string }[]>();
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  let updated = 0;
  const failures: string[] = [];
  for (const p of profiles ?? []) {
    try {
      const { profile } = await applyRollup(supabase, p.session_id, today, period);
      if (profile) updated++;
    } catch (e) {
      failures.push(p.session_id.slice(0, 8));
      console.error("[backfill] rollup failed for", p.session_id, e);
    }
  }

  return NextResponse.json({
    success: true,
    totalProfiles: (profiles ?? []).length,
    updated,
    failures: failures.length,
  });
}
