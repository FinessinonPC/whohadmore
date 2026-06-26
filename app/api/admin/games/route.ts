import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import type { DailyGame } from "@/types";

export const dynamic = "force-dynamic";

// Lists games for a month ("YYYY-MM") for the admin calendar - includes drafts.
export async function GET(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ games: [] });
  }

  const month = new URL(req.url).searchParams.get("month"); // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  // Bound by [first of month, first of next month). Using "${month}-31" would
  // produce an invalid date (e.g. 2026-06-31) and error the whole query.
  const [y, m] = month.split("-").map(Number); // m is 1-based
  const start = `${month}-01`;
  const nextStart = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("daily_games")
    .select("*")
    .gte("play_date", start)
    .lt("play_date", nextStart)
    .order("play_date", { ascending: true })
    .returns<DailyGame[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ games: data ?? [] });
}
