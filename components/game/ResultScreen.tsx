"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TopNav } from "@/components/ui/TopNav";
import { CountUp } from "./CountUp";
import { Confetti } from "./Confetti";
import { ChainTimeline } from "./ChainTimeline";
import { LivesDisplay } from "./LivesDisplay";
import { DayStandings } from "./DayStandings";
import { FormatFeedback } from "./FormatFeedback";
import { useProfile } from "@/hooks/useProfile";
import { getSessionId } from "@/lib/playStore";
import { achievementById, dailyScore, heartsFor } from "@/lib/leaderboard";
import { formatDisplayDate, isToday } from "@/lib/date";
import { isJuly4th } from "@/lib/festive";
import { Fireworks } from "./Fireworks";

interface ResultScreenProps {
  reached: number;
  rounds: number;
  lives: number;
  timeSeconds: number;
  wrongRounds: number[];
  xpEarned: number;
  topicLabel: string;
  date: string;
  gameNumber: number;
  mode: "play" | "preview";
  alreadyPlayed?: boolean;
  /** Set to the new level if this run pushed a signed-in player up a level. */
  levelUp?: number | null;
  /** Current daily streak (signed-in players); shown as a stat. */
  streak?: number | null;
  /** Achievement ids newly unlocked by this game (signed-in players). */
  newAchievements?: string[];
  onPlayAgain?: () => void;
  onClose?: () => void;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function headline(reached: number, rounds: number, lives: number): string {
  if (reached >= rounds && lives >= 3) return "Flawless run.";
  if (reached >= rounds) return "You went the distance.";
  if (reached >= Math.ceil(rounds * 0.66)) return "So close.";
  if (reached === 0) return "Tough start.";
  return "Out of lives.";
}

export function ResultScreen({
  reached,
  rounds,
  lives,
  timeSeconds,
  wrongRounds,
  xpEarned,
  topicLabel,
  date,
  gameNumber,
  mode,
  alreadyPlayed = false,
  levelUp = null,
  streak = null,
  newAchievements = [],
  onPlayAgain,
  onClose,
}: ResultScreenProps) {
  const [copied, setCopied] = useState(false);
  const [pct, setPct] = useState<{ percentile: number | null; total: number } | null>(null);
  const daily = isToday(date);
  const clearedChain = mode === "play" && !alreadyPlayed && rounds > 0 && reached >= rounds;
  // The score that gets featured on the leaderboard (streak-free).
  const score = dailyScore(reached, heartsFor(lives), timeSeconds);

  // How you stacked up against everyone else who played this day - honest
  // social proof. Real plays only (not the admin preview).
  useEffect(() => {
    if (mode !== "play") return;
    let cancelled = false;
    fetch(`/api/leaderboard/percentile?date=${date}&session=${getSessionId()}&score=${score}`)
      .then((r) => r.json())
      .then((d: { percentile: number | null; total: number }) => {
        if (!cancelled) setPct(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mode, date, score]);

  const pctLabel =
    pct?.percentile != null
      ? `You beat ${pct.percentile}% of ${daily ? "today's" : "this puzzle's"} players`
      : pct && pct.total === 0 && daily
        ? "You're among the first to play today!"
        : null;

  async function share() {
    const hearts = heartsFor(lives);
    const heartsBar = "❤️".repeat(hearts) + "🤍".repeat(3 - hearts);
    const text = [
      `WhoHadMore No. ${gameNumber}`,
      `${reached}/${rounds}`,
      pct?.percentile != null ? `Beat ${pct.percentile}% of players` : "",
      heartsBar,
      formatClock(timeSeconds),
      dailyScore(reached, hearts, timeSeconds).toLocaleString(),
      typeof window !== "undefined" ? window.location.origin : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "WhoHadMore", text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5 sm:max-w-xl">
      {clearedChain && <Confetti />}
      {isJuly4th(date) && <Fireworks />}

      {mode === "play" && <TopNav />}

      <motion.div
        className="relative z-[46] mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center py-6 text-center sm:max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
      >
        {isJuly4th(date) && (
          <div className="mb-3 rounded-full border border-[#FF3B30]/25 bg-gradient-to-r from-[#FF3B30]/12 via-transparent to-[#2E6BFF]/12 px-5 py-1.5 text-sm font-bold text-ink">
            Happy Fourth of July 🌭
          </div>
        )}
        <p className="small-caps text-[11px] text-ink-secondary">
          {formatDisplayDate(date)} · {mode === "preview" ? "Preview" : `Game No. ${gameNumber}`}
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">{topicLabel}</p>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
          {headline(reached, rounds, lives)}
        </h2>

        {/* Hero: your leaderboard score */}
        <div className="mt-5">
          <span className="font-condensed text-[5rem] font-bold leading-none text-ink">
            <CountUp value={score} run duration={1.2} />
          </span>
        </div>
        <p className="small-caps mt-1 text-[11px] text-ink-secondary">
          your score · featured on the leaderboard
        </p>
        {pctLabel && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-2.5 rounded-full bg-correct/10 px-4 py-1.5 text-sm font-bold text-correct"
          >
            {pctLabel}
          </motion.div>
        )}
        <p className="mt-2 text-sm font-semibold text-ink">
          Reached {reached}/{rounds} rounds
        </p>

        {/* Frozen run timeline */}
        <div className="mt-4 w-full">
          <ChainTimeline position={reached} total={rounds} wrongRounds={wrongRounds} />
        </div>

        {/* XP earned - on top */}
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-correct/30 bg-correct/10 px-4 py-2">
          <span className="font-condensed text-xl font-bold text-correct">
            +<CountUp value={xpEarned} run duration={1} /> XP
          </span>
          <span className="text-xs font-semibold text-correct/80">earned</span>
        </div>

        {/* Level-up moment */}
        {levelUp != null && (
          <motion.div
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-background"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.12, 1], opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
          >
            <span className="text-base">⭐</span>
            <span className="text-sm font-extrabold">Level {levelUp}!</span>
          </motion.div>
        )}

        {/* Achievements unlocked this game */}
        {newAchievements.length > 0 && (
          <div className="mt-4 w-full">
            <p className="small-caps text-[10px] text-ink-secondary">
              Achievement{newAchievements.length > 1 ? "s" : ""} unlocked
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {newAchievements.map((id, i) => {
                const a = achievementById(id);
                if (!a) return null;
                return (
                  <motion.div
                    key={id}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.1, type: "spring", damping: 18, stiffness: 240 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#FFB300]/40 bg-[#FFB300]/10 px-3 py-1.5"
                  >
                    <span className="text-base leading-none">{a.icon}</span>
                    <span className="text-xs font-bold text-ink">{a.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Streak · time · hearts */}
        <div className="mt-5 grid w-full max-w-xs grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface py-3.5">
          <div className="flex flex-col items-center justify-center gap-1.5 px-2">
            <span className="tabular text-xl font-extrabold text-ink">🔥 {streak ?? 0}</span>
            <span className="small-caps text-[9px] text-ink-secondary">Streak</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 px-2">
            <span className="tabular text-xl font-extrabold text-ink">{formatClock(timeSeconds)}</span>
            <span className="small-caps text-[9px] text-ink-secondary">Time</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 px-2">
            <LivesDisplay lives={lives} size="sm" />
            <span className="small-caps text-[9px] text-ink-secondary">Hearts</span>
          </div>
        </div>

        {/* Archived games: that day's standings, so replayers see how they did */}
        {mode === "play" && !daily && (
          <DayStandings date={date} me={{ reached, hearts: heartsFor(lives), timeSeconds, score }} />
        )}

        {/* One-time nudge on the new multi-game format, after a finished game */}
        {mode === "play" && <FormatFeedback />}

        {/* Actions */}
        {mode === "preview" ? (
          <div className="mt-7 flex w-full flex-col gap-2.5">
            <Button size="lg" onClick={onPlayAgain} className="w-full">
              Play again
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
              Close preview
            </Button>
          </div>
        ) : (
          <div className="mt-7 flex w-full flex-col gap-3">
            <ClaimBlock />

            {/* Back to the day's hub - the other three games are one tap away */}
            <Link href={daily ? "/" : `/day/${date}`} className="contents">
              <button className="flex w-full items-center justify-between rounded-2xl bg-cta px-5 py-4 text-left text-background transition-colors hover:opacity-90">
                <span>
                  <span className="block text-[15px] font-bold">
                    {daily ? "Play the rest of today" : "Play the rest of this day"}
                  </span>
                  <span className="block text-xs opacity-70">Duality, Word and Mini are waiting</span>
                </span>
                <span className="text-xl">→</span>
              </button>
            </Link>

            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="secondary" onClick={share}>
                {copied ? "Copied" : "Share"}
              </Button>
              <Link href="/leaderboard" className="contents">
                <Button variant="secondary" className="w-full">
                  Leaderboard
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs text-ink-secondary">
              {daily ? "A new game drops at midnight." : "Playing the archive."}
            </p>
          </div>
        )}
      </motion.div>
    </main>
  );
}

/** Sign-up CTA / signed-in state for the result screen. The full email flow
 *  lives on the profile page; the just-played game is already recorded, so
 *  signing up there still counts it. */
function ClaimBlock() {
  const { profile, loading } = useProfile();

  if (loading) {
    return <div className="h-[68px] animate-pulse rounded-2xl bg-surface" />;
  }

  if (profile?.username) {
    return (
      <div className="rounded-2xl border border-correct/30 bg-correct/5 px-4 py-3 text-center">
        <p className="text-sm text-ink">
          Signed in as <span className="font-extrabold">{profile.username}</span>
        </p>
        <p className="mt-0.5 text-xs text-ink-secondary">Score added to your totals - keep your streak going.</p>
      </div>
    );
  }

  return (
    <Link href="/profile" className="contents">
      <button className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 text-left transition-colors hover:bg-border/40">
        <span>
          <span className="block text-[15px] font-bold text-ink">Save your score</span>
          <span className="block text-xs text-ink-secondary">
            Sign up with your email to bank it and climb the leaderboard
          </span>
        </span>
        <span className="text-xl text-ink-secondary">→</span>
      </button>
    </Link>
  );
}
