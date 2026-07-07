import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate } from "@/lib/date";
import { validateMinigame, type MinigameMode } from "@/lib/minigameSchemas";
import { getDualityContent, getMiniContent, getWordContent } from "@/lib/minigames";

export const dynamic = "force-dynamic";

const MODES: MinigameMode[] = ["duality", "word", "mini"];

// GET /api/admin/minigame?date=YYYY-MM-DD   -> custom payloads for that day
// GET /api/admin/minigame?month=YYYY-MM     -> which (date, mode) rows exist
export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ custom: {}, rows: [], configured: false });

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");
  const supabase = getServiceSupabase();

  try {
    if (date && isValidISODate(date)) {
      const { data } = await supabase
        .from("daily_minigames")
        .select("mode, payload")
        .eq("play_date", date)
        .returns<{ mode: MinigameMode; payload: unknown }[]>();
      const custom: Record<string, unknown> = {};
      for (const row of data ?? []) custom[row.mode] = row.payload;
      // What the player actually gets that day (custom if saved, else pack).
      const [duality, word, mini] = await Promise.all([
        getDualityContent(date),
        getWordContent(date),
        getMiniContent(date),
      ]);
      return NextResponse.json({
        custom,
        effective: { duality, word: { answer: word }, mini },
        configured: true,
      });
    }
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const { data } = await supabase
        .from("daily_minigames")
        .select("play_date, mode")
        .gte("play_date", `${month}-01`)
        .lte("play_date", `${month}-31`)
        .returns<{ play_date: string; mode: MinigameMode }[]>();
      return NextResponse.json({ rows: data ?? [], configured: true });
    }
    return NextResponse.json({ error: "Pass ?date= or ?month=" }, { status: 400 });
  } catch (e) {
    // Table not created yet - report cleanly so the admin UI can say so.
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ custom: {}, rows: [], configured: true, error: "query_failed", detail });
  }
}

// POST { date, mode, payload } - validate hard, then upsert.
export async function POST(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  let body: { date?: string; mode?: MinigameMode; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { date, mode, payload } = body;
  if (!date || !isValidISODate(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  if (!mode || !MODES.includes(mode)) return NextResponse.json({ error: "Invalid mode" }, { status: 400 });

  const v = validateMinigame(mode, payload);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const { error } = await getServiceSupabase()
    .from("daily_minigames")
    .upsert(
      { play_date: date, mode, payload: v.value, updated_at: new Date().toISOString() },
      { onConflict: "play_date,mode" }
    );
  if (error) {
    const hint = error.message.includes("daily_minigames")
      ? " (has supabase/migrations/0005_daily_minigames.sql been run?)"
      : "";
    return NextResponse.json({ error: error.message + hint }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE { date, mode } - drop the custom row, reverting the day to auto pack.
export async function DELETE(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  let body: { date?: string; mode?: MinigameMode };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { date, mode } = body;
  if (!date || !isValidISODate(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  if (!mode || !MODES.includes(mode)) return NextResponse.json({ error: "Invalid mode" }, { status: 400 });

  const { error } = await getServiceSupabase()
    .from("daily_minigames")
    .delete()
    .eq("play_date", date)
    .eq("mode", mode);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
