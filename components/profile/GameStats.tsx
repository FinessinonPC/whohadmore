"use client";

import { GameWordmark } from "@/components/ui/GameWordmarks";
import { modeDef } from "@/lib/modes";
import {
  formatSeconds,
  useGameStats,
  type GameStatsData,
} from "@/hooks/useGameStats";

// ============================================================================
// Lifetime stats, one card per game, each speaking that game's language:
// correct calls for Chain, mistakes for Duality, guesses (with the classic
// distribution) for Word, solve times for the Mini. Points stay on the shared
// 0–1000 scale so the games remain comparable at a glance.
// ============================================================================

const DASH = "–";

const fmt1 = (v: number | null): string => (v === null ? DASH : (Math.round(v * 10) / 10).toString());
const fmtInt = (v: number | null): string => (v === null ? DASH : Math.round(v).toLocaleString());
const fmtPct = (v: number | null): string => (v === null ? DASH : `${Math.round(v * 100)}%`);
const fmtTime = (v: number | null): string => (v === null ? DASH : formatSeconds(v));

export function GameStats() {
  const stats = useGameStats();
  const { chain, duality, word, mini } = stats;

  const totalPlayed = chain.played + duality.played + word.played + mini.played;
  const totalPoints =
    (chain.avgPoints ?? 0) * chain.played +
    (duality.avgPoints ?? 0) * duality.played +
    (word.avgPoints ?? 0) * word.played +
    (mini.avgPoints ?? 0) * mini.played;
  const avgPoints = totalPlayed > 0 ? Math.round(totalPoints / totalPlayed) : null;
  const bestGame = Math.max(chain.best, duality.best, word.best, mini.best);

  return (
    <section className="mt-4 card-ink rounded-2xl p-6">
      <h2 className="text-sm font-extrabold text-ink">Across every game</h2>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-secondary">
        Points are how you score each day - up to 1,000 a game. (Separate from XP, which
        levels you up over time.)
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <Big value={totalPlayed.toLocaleString()} label="Games played" />
        <Big value={fmtInt(avgPoints)} label="Avg points" />
        <Big value={bestGame > 0 ? bestGame.toLocaleString() : DASH} label="Best game" />
      </div>

      <h2 className="mt-6 text-sm font-extrabold text-ink">By game</h2>
      <div className="mt-3 flex flex-col gap-3">
        <ChainCard stats={stats} />
        <DualityCard stats={stats} />
        <WordCard stats={stats} />
        <MiniCard stats={stats} />
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-secondary">
        Counts every game on your account, plus any recorded on this device.
      </p>
    </section>
  );
}

function ChainCard({ stats }: { stats: GameStatsData }) {
  const c = stats.chain;
  const avgCorrect =
    c.avgCorrect === null ? DASH : `${fmt1(c.avgCorrect)}/${Math.round(c.avgRounds ?? 0)}`;
  return (
    <GameCard mode="chain" played={c.played}>
      <Cell label="Avg correct" value={avgCorrect} />
      <Cell label="Perfect runs" value={c.played ? c.perfect.toLocaleString() : DASH} />
      <Cell label="Avg pts" value={fmtInt(c.avgPoints)} />
      <Cell label="Best" value={c.played ? c.best.toLocaleString() : DASH} />
    </GameCard>
  );
}

function DualityCard({ stats }: { stats: GameStatsData }) {
  const d = stats.duality;
  return (
    <GameCard mode="duality" played={d.played}>
      <Cell label="Solve rate" value={fmtPct(d.solveRate)} />
      <Cell label="Flawless" value={d.played ? d.perfect.toLocaleString() : DASH} />
      <Cell label="Avg mistakes" value={fmt1(d.avgMistakes)} />
      <Cell label="Avg pts" value={fmtInt(d.avgPoints)} />
    </GameCard>
  );
}

function WordCard({ stats }: { stats: GameStatsData }) {
  const w = stats.word;
  const maxDist = Math.max(1, ...w.dist);
  const hasDist = w.dist.some((n) => n > 0);
  return (
    <GameCard mode="word" played={w.played}>
      <Cell label="Win rate" value={fmtPct(w.winRate)} />
      <Cell label="Avg guesses" value={fmt1(w.avgGuesses)} />
      <Cell label="Avg pts" value={fmtInt(w.avgPoints)} />
      <Cell label="Best" value={w.played ? w.best.toLocaleString() : DASH} />
      {hasDist && (
        <div className="col-span-4 mt-1 border-t border-border pt-2.5">
          <p className="small-caps mb-1.5 text-[9px] text-ink-secondary">Guess distribution</p>
          <div className="flex flex-col gap-1">
            {w.dist.map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 shrink-0 text-right text-[10px] font-bold text-ink-secondary">
                  {i + 1}
                </span>
                <div className="h-3.5 flex-1">
                  <div
                    className={`flex h-full min-w-[18px] items-center justify-end rounded-[4px] pr-1 ${
                      n > 0 ? "bg-[#FFC400]" : "bg-border"
                    }`}
                    style={{ width: n > 0 ? `${Math.max(8, (n / maxDist) * 100)}%` : "18px" }}
                  >
                    <span className={`text-[9px] font-extrabold ${n > 0 ? "text-[#0B0D10]" : "text-ink-secondary"}`}>
                      {n}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GameCard>
  );
}

function MiniCard({ stats }: { stats: GameStatsData }) {
  const m = stats.mini;
  return (
    <GameCard mode="mini" played={m.played}>
      <Cell label="Avg time" value={fmtTime(m.avgSeconds)} />
      <Cell label="Best time" value={fmtTime(m.bestSeconds)} />
      <Cell label="Clean solves" value={m.played ? m.clean.toLocaleString() : DASH} />
      <Cell label="Avg pts" value={fmtInt(m.avgPoints)} />
    </GameCard>
  );
}

function GameCard({
  mode,
  played,
  children,
}: {
  mode: "chain" | "duality" | "word" | "mini";
  played: number;
  children: React.ReactNode;
}) {
  return (
    <div className="wonky border border-border bg-background px-4 py-3.5">
      <div className="flex items-baseline justify-between">
        <span style={{ color: modeDef(mode).accent }}>
          <GameWordmark mode={mode} className="text-xl" />
        </span>
        <span className="text-[11px] font-semibold text-ink-secondary">
          {played > 0 ? `${played.toLocaleString()} played` : "Not played yet"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">{children}</div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="tabular truncate font-condensed text-xl font-semibold leading-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-secondary">{label}</p>
    </div>
  );
}

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="tabular font-condensed text-3xl font-semibold text-ink">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">{label}</p>
    </div>
  );
}
