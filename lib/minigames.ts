// ============================================================================
// Server-side content resolution for the pack games. A custom row in
// daily_minigames (authored in the admin, usually via AI) overrides the
// bundled pack for that date; otherwise the deterministic pack rotation
// serves - so every date always has playable content, DB or not.
// ============================================================================

import { getServerSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import {
  getDualityDaily,
  getMiniDaily,
  getWordDaily,
  type DualityDay,
  type MiniDay,
} from "@/lib/contentPacks";
import {
  validateDuality,
  validateMini,
  validateWord,
  type MinigameMode,
} from "@/lib/minigameSchemas";

async function customPayload(mode: MinigameMode, date: string): Promise<unknown | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await getServerSupabase()
      .from("daily_minigames")
      .select("payload")
      .eq("play_date", date)
      .eq("mode", mode)
      .maybeSingle<{ payload: unknown }>();
    return data?.payload ?? null;
  } catch {
    return null; // table missing / query failed - pack fallback
  }
}

export async function getDualityContent(date: string): Promise<DualityDay> {
  const raw = await customPayload("duality", date);
  if (raw) {
    const v = validateDuality(raw);
    if (v.ok) return v.value;
  }
  return getDualityDaily(date);
}

export async function getWordContent(date: string): Promise<string> {
  const raw = await customPayload("word", date);
  if (raw) {
    const v = validateWord(raw);
    if (v.ok) return v.value.answer;
  }
  return getWordDaily(date);
}

export async function getMiniContent(date: string): Promise<MiniDay> {
  const raw = await customPayload("mini", date);
  if (raw) {
    const v = validateMini(raw);
    if (v.ok) return v.value;
  }
  return getMiniDaily(date);
}
