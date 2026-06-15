import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import type { DailyGame } from "@/types";

export const dynamic = "force-dynamic";

// Lists games for a month ("YYYY-MM") for the admin calendar — includes drafts.
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

  const start = `${month}-01`;
  const end = `${month}-31`; // string compare on ISO dates is safe within a month

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("daily_games")
    .select("*")
    .gte("play_date", start)
    .lte("play_date", end)
    .order("play_date", { ascending: true })
    .returns<DailyGame[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ games: data ?? [] });
}
