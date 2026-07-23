"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminClient";

interface DailyRow {
  date: string;
  players: number;
  new: number;
  returning: number;
}
interface Cohort {
  week: string;
  newPlayers: number;
  back1: number;
  back2: number;
  back3: number;
}
interface Data {
  configured: boolean;
  error?: string;
  overview?: {
    totalPlayers: number;
    accounts: number;
    playersToday: number;
    playersThisWeek: number;
    gamesToday: number;
  };
  daily?: DailyRow[];
  cohorts?: Cohort[];
  share?: {
    configured: boolean;
    modalShown: number;
    sharesTotal: number;
    sharesFromModal: number;
    pastCardClicks: number;
  };
}

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "–");
const shortDay = (iso: string) => iso.slice(5); // MM-DD

export function AnalyticsView() {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    adminFetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d: Data) => setData(d))
      .catch(() => setFailed(true));
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Analytics</h1>
          <p className="mt-0.5 text-sm text-ink-secondary">
            Who&apos;s playing, and whether they come back.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-ink"
        >
          ‹ Calendar
        </Link>
      </header>

      {failed || data?.error ? (
        <p className="rounded-xl border border-wrong/30 bg-wrong/5 p-4 text-sm text-wrong">
          Couldn&apos;t load analytics. {data?.error === "query_failed" ? "A query failed - check the server logs." : "Try again."}
        </p>
      ) : data && !data.configured ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-ink-secondary">
          Supabase isn&apos;t configured, so there&apos;s no data to show.
        </p>
      ) : !data ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Overview */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Players today" value={data.overview?.playersToday ?? 0} accent />
            <Stat label="This week" value={data.overview?.playersThisWeek ?? 0} />
            <Stat label="All-time players" value={data.overview?.totalPlayers ?? 0} />
            <Stat label="Accounts" value={data.overview?.accounts ?? 0} />
            <Stat label="Games today" value={data.overview?.gamesToday ?? 0} />
          </section>

          {/* New vs returning */}
          <Panel title="Daily players — new vs returning" hint="last 30 days">
            <NewReturningChart daily={data.daily ?? []} />
            <p className="mt-3 text-[11px] leading-snug text-ink-secondary">
              The <span className="font-bold text-ink">green</span> (returning) share is the one that
              matters — if it&apos;s a real slice most days, you&apos;re building a base. Near-zero
              means you&apos;re churning through strangers.
            </p>
          </Panel>

          {/* Cohort retention */}
          <Panel title="Weekly retention" hint="did each week's new players come back?">
            <CohortTable cohorts={data.cohorts ?? []} />
            <p className="mt-3 text-[11px] leading-snug text-ink-secondary">
              Read across: of the players whose first day was that week, the % who returned 1 / 2 / 3
              weeks later. Week-1 above ~30% is healthy for a daily game; single digits is a leaky
              bucket.
            </p>
          </Panel>

          {/* Share funnel */}
          <Panel title="Share funnel" hint="the growth loop">
            {data.share?.configured ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Pop-ups shown" value={data.share.modalShown} />
                <Stat
                  label="Shared from pop-up"
                  value={data.share.sharesFromModal}
                  note={`${pct(data.share.sharesFromModal, data.share.modalShown)} of shown`}
                />
                <Stat label="Shares (all surfaces)" value={data.share.sharesTotal} />
                <Stat label="Past-card taps" value={data.share.pastCardClicks} />
              </div>
            ) : (
              <p className="text-sm text-ink-secondary">
                No share events yet (or the analytics_events table isn&apos;t migrated).
              </p>
            )}
          </Panel>

          <p className="text-center text-[11px] text-ink-secondary">
            A player is an anonymous session; counts are device-level, so they slightly undercount
            people who switch devices or clear storage.
          </p>
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: number;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-3.5 ${accent ? "border-correct/40 bg-correct/5" : "border-border bg-surface"}`}>
      <p className="tabular text-2xl font-extrabold leading-none text-ink">{value.toLocaleString()}</p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">{label}</p>
      {note && <p className="mt-0.5 text-[10px] font-bold text-correct">{note}</p>}
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface/50 p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-extrabold text-ink">{title}</h2>
        {hint && <span className="text-[11px] font-semibold text-ink-secondary">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function NewReturningChart({ daily }: { daily: DailyRow[] }) {
  const max = Math.max(1, ...daily.map((d) => d.players));
  return (
    <div className="flex h-40 items-end gap-[3px]">
      {daily.map((d) => {
        const h = (d.players / max) * 100;
        const retShare = d.players > 0 ? (d.returning / d.players) * 100 : 0;
        return (
          <div
            key={d.date}
            className="group relative flex flex-1 flex-col justify-end"
            style={{ height: "100%" }}
            title={`${d.date}: ${d.players} players (${d.new} new, ${d.returning} returning)`}
          >
            <div className="w-full overflow-hidden rounded-t-[3px] bg-[#FFB300]" style={{ height: `${h}%` }}>
              <div className="w-full bg-correct" style={{ height: `${retShare}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CohortTable({ cohorts }: { cohorts: Cohort[] }) {
  if (cohorts.length === 0) {
    return <p className="text-sm text-ink-secondary">Not enough history yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-wide text-ink-secondary">
            <th className="py-2 font-bold">Week of</th>
            <th className="py-2 text-right font-bold">New</th>
            <th className="py-2 text-right font-bold">Wk 1</th>
            <th className="py-2 text-right font-bold">Wk 2</th>
            <th className="py-2 text-right font-bold">Wk 3</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.week} className="border-b border-border/50">
              <td className="py-2 font-semibold text-ink">{c.week}</td>
              <td className="tabular py-2 text-right font-bold text-ink">{c.newPlayers}</td>
              <RetCell back={c.back1} total={c.newPlayers} />
              <RetCell back={c.back2} total={c.newPlayers} />
              <RetCell back={c.back3} total={c.newPlayers} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RetCell({ back, total }: { back: number; total: number }) {
  const p = total > 0 ? back / total : 0;
  const tone = p >= 0.3 ? "text-correct" : p > 0 ? "text-ink" : "text-ink-secondary";
  return (
    <td className={`tabular py-2 text-right font-semibold ${tone}`}>
      {total > 0 ? `${Math.round(p * 100)}%` : "–"}
      <span className="ml-1 text-[10px] font-normal text-ink-secondary">({back})</span>
    </td>
  );
}
