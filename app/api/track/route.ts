import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

// The only events we accept - a tight allowlist so the table can't be spammed
// with arbitrary strings.
const EVENTS = new Set(["share_click", "results_modal_shown", "past_card_click"]);

const clean = (v: unknown, max = 40): string | null =>
  typeof v === "string" && v.length > 0 && v.length <= max ? v : null;

// POST /api/track { event, session_id, surface?, game?, date? }
// First-party mirror of the Vercel custom events (which need a paid plan to
// view). Best-effort by design: always answers ok so analytics can never
// break gameplay, and quietly no-ops until the table is migrated.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      event?: string;
      session_id?: string;
      surface?: string;
      game?: string;
      date?: string;
    };
    const event = clean(body.event);
    const session_id = clean(body.session_id, 64);
    if (!event || !EVENTS.has(event) || !session_id) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, recorded: false });

    const { error } = await getServiceSupabase().from("analytics_events").insert({
      event,
      session_id,
      surface: clean(body.surface),
      game: clean(body.game),
      play_date: body.date && isValidISODate(body.date) ? body.date : null,
    });
    return NextResponse.json({ ok: true, recorded: !error });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
