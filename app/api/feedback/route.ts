import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";

export const dynamic = "force-dynamic";

// POST { session_id, topic, value } - lightweight product feedback (e.g. the
// format thumbs up/down). Best-effort: if the feedback table isn't created,
// it quietly no-ops so the client vote still feels recorded.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      session_id?: string;
      topic?: string;
      value?: string;
    };
    const { session_id, topic, value } = body;
    if (!session_id || !topic || !value || value.length > 40 || topic.length > 40) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, recorded: false });

    const { error } = await getServiceSupabase()
      .from("feedback")
      .upsert(
        { session_id, topic, value },
        { onConflict: "session_id,topic" }
      );
    if (error) {
      console.error("[feedback] not recorded (is feedback table created?):", error.message);
      return NextResponse.json({ ok: true, recorded: false });
    }
    return NextResponse.json({ ok: true, recorded: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
