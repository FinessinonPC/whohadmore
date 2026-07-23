import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { todayISO } from "@/lib/date";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET /api/admin/analytics - the numbers that actually matter for a daily game:
// who's playing, and (the one that decides everything) whether they come back.
// Retention comes from the play tables keyed by session_id + play_date; the
// share funnel comes from analytics_events. Aggregated in JS - fine at this
// scale, and it keeps the query logic in one readable place.

interface Play {
  sid: string;
  date: string; // YYYY-MM-DD
}

/** Fetch every row of a (session_id, play_date) table, paginating past the
 *  1000-row API cap so retention stays correct as history grows. */
async function fetchPlays(supabase: SupabaseClient, table: string): Promise<Play[]> {
  const out: Play[] = [];
  const page = 1000;
  for (let from = 0; from < 100_000; from += page) {
    const { data, error } = await supabase
      .from(table)
      .select("session_id, play_date")
      .order("play_date", { ascending: true })
      .range(from, from + page - 1)
      .returns<{ session_id: string | null; play_date: string | null }[]>();
    if (error || !data || data.length === 0) break;
    for (const r of data) {
      if (r.session_id && r.play_date) out.push({ sid: String(r.session_id), date: r.play_date });
    }
    if (data.length < page) break;
  }
  return out;
}

// --- Date helpers (plain server code, YYYY-MM-DD in UTC) --------------------
function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function mondayOf(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ configured: false });

  const supabase = getServiceSupabase();
  const today = todayISO();

  try {
    const [chainPlays, modePlays] = await Promise.all([
      fetchPlays(supabase, "game_results"),
      fetchPlays(supabase, "game_mode_results"),
    ]);

    // One play-day per (session, date) across both tables.
    const dayKeys = new Set<string>();
    const playsByDate = new Map<string, Set<string>>(); // date -> sids
    const firstPlay = new Map<string, string>(); // sid -> earliest date
    const datesBySid = new Map<string, Set<string>>(); // sid -> dates
    for (const p of [...chainPlays, ...modePlays]) {
      const key = `${p.sid}|${p.date}`;
      if (dayKeys.has(key)) continue;
      dayKeys.add(key);
      (playsByDate.get(p.date) ?? playsByDate.set(p.date, new Set()).get(p.date)!).add(p.sid);
      (datesBySid.get(p.sid) ?? datesBySid.set(p.sid, new Set()).get(p.sid)!).add(p.date);
      const cur = firstPlay.get(p.sid);
      if (!cur || p.date < cur) firstPlay.set(p.sid, p.date);
    }

    const distinctOn = (date: string) => playsByDate.get(date)?.size ?? 0;
    const week = new Set<string>();
    for (let i = 0; i < 7; i++) for (const s of playsByDate.get(addDays(today, -i)) ?? []) week.add(s);

    // --- Accounts + game count (cheap count queries) -------------------------
    const [{ count: accounts }, { count: gamesToday }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("game_results")
        .select("id", { count: "exact", head: true })
        .eq("play_date", today),
    ]);

    // --- Daily new vs returning, last 30 days --------------------------------
    const daily = [];
    for (let i = 29; i >= 0; i--) {
      const date = addDays(today, -i);
      const sids = playsByDate.get(date) ?? new Set<string>();
      let fresh = 0;
      for (const s of sids) if (firstPlay.get(s) === date) fresh++;
      daily.push({ date, players: sids.size, new: fresh, returning: sids.size - fresh });
    }

    // --- Weekly cohort retention --------------------------------------------
    const cohortNew = new Map<string, Set<string>>(); // cohort monday -> sids
    for (const [sid, first] of firstPlay) {
      const wk = mondayOf(first);
      (cohortNew.get(wk) ?? cohortNew.set(wk, new Set()).get(wk)!).add(sid);
    }
    const playedInWeek = (sid: string, weekMonday: string): boolean => {
      const dates = datesBySid.get(sid);
      if (!dates) return false;
      for (let d = 0; d < 7; d++) if (dates.has(addDays(weekMonday, d))) return true;
      return false;
    };
    const cohorts = Array.from(cohortNew.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 8)
      .map(([wk, sids]) => {
        const back = (offsetWeeks: number) => {
          const target = addDays(wk, offsetWeeks * 7);
          let n = 0;
          for (const s of sids) if (playedInWeek(s, target)) n++;
          return n;
        };
        return { week: wk, newPlayers: sids.size, back1: back(1), back2: back(2), back3: back(3) };
      });

    // --- Share funnel (analytics_events) - best-effort -----------------------
    let share = { configured: false, modalShown: 0, sharesTotal: 0, sharesFromModal: 0, pastCardClicks: 0 };
    try {
      const { data: ev } = await supabase
        .from("analytics_events")
        .select("event, surface")
        .limit(50_000)
        .returns<{ event: string; surface: string | null }[]>();
      if (ev) {
        share = {
          configured: true,
          modalShown: ev.filter((e) => e.event === "results_modal_shown").length,
          sharesTotal: ev.filter((e) => e.event === "share_click").length,
          sharesFromModal: ev.filter((e) => e.event === "share_click" && e.surface === "results_modal").length,
          pastCardClicks: ev.filter((e) => e.event === "past_card_click").length,
        };
      }
    } catch {
      /* analytics_events not migrated - leave share disabled */
    }

    return NextResponse.json({
      configured: true,
      overview: {
        totalPlayers: firstPlay.size,
        accounts: accounts ?? 0,
        playersToday: distinctOn(today),
        playersThisWeek: week.size,
        gamesToday: gamesToday ?? 0,
      },
      daily,
      cohorts,
      share,
    });
  } catch (e) {
    console.error("[analytics] failed:", e);
    return NextResponse.json({ configured: true, error: "query_failed" }, { status: 500 });
  }
}
