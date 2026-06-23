import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";

export const dynamic = "force-dynamic";

// Health + keep-alive. Hitting this runs a tiny DB query, which counts as
// Supabase activity and prevents the free tier from pausing after inactivity.
// Also handy to confirm the deployment can actually reach the database.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, db: false, configured: false });
  }
  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("daily_games")
      .select("id", { count: "exact", head: true });
    return NextResponse.json({
      ok: !error,
      db: !error,
      configured: true,
      error: error?.message,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, db: false, configured: true, error: String(e) },
      { status: 500 }
    );
  }
}
