import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import type { MinigameMode } from "@/lib/minigameSchemas";
import { dedupeSorted, packWords, wordsFromPayload } from "@/lib/usedWords";

export const dynamic = "force-dynamic";

const MODES: MinigameMode[] = ["duality", "word", "mini"];

// GET /api/admin/used-words[?packs=0]
// Every word already used across the pack games, per mode - the list to feed
// the AI so it never reuses one. Unions the stored custom days (daily_minigames)
// with the bundled fallback pack (pass ?packs=0 to see only what you've
// published). Deriving on read means a freshly-published game is included the
// moment it's saved.
export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includePacks = new URL(req.url).searchParams.get("packs") !== "0";

  const published: Record<MinigameMode, string[]> = { duality: [], word: [], mini: [] };
  let configured = isSupabaseConfigured();

  if (configured) {
    try {
      const { data } = await getServiceSupabase()
        .from("daily_minigames")
        .select("mode, payload")
        .returns<{ mode: MinigameMode; payload: unknown }[]>();
      for (const row of data ?? []) {
        if (MODES.includes(row.mode)) published[row.mode].push(...wordsFromPayload(row.mode, row.payload));
      }
    } catch {
      // Table not migrated yet - fall back to pack-only, still useful.
      configured = false;
    }
  }

  const words = {} as Record<MinigameMode, string[]>;
  const counts = {} as Record<MinigameMode, { total: number; published: number }>;
  for (const mode of MODES) {
    const pub = dedupeSorted(published[mode]);
    const all = dedupeSorted([...published[mode], ...(includePacks ? packWords(mode) : [])]);
    words[mode] = all;
    counts[mode] = { total: all.length, published: pub.length };
  }

  return NextResponse.json({ configured, includesPacks: includePacks, words, counts });
}
