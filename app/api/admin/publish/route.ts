import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isValidISODate } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/mockGame";

export const dynamic = "force-dynamic";

// Flip the published flag for a day without touching its cards.
export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  let body: { play_date?: string; published?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.play_date || !isValidISODate(body.play_date)) {
    return NextResponse.json({ error: "Invalid play_date" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("daily_games")
    .update({ published: Boolean(body.published) })
    .eq("play_date", body.play_date)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "No saved game for that date yet - save it first." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, published: Boolean(body.published) });
}
