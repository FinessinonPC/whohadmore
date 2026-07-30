// ============================================================================
// What a player posts.
//
// The old share was a scoreboard: four game names and four numbers. Nothing in
// it told a reader what the puzzle was ABOUT, gave them a claim to disagree
// with, or looked like anything in a feed. A number nobody can argue with is a
// number nobody forwards.
//
// This leads with Chain, because Chain is the only game here that isn't a
// format people already play elsewhere - and because it's argumentative. "No
// way he had more than her" is a thing people say out loud, and saying it out
// loud is the growth loop.
//
// Three deliberate parts:
//   the topic     tells the reader what today is about, so the post has a
//                 subject rather than just a score
//   the run       a glanceable ✅/❌ line, the way a Wordle grid is glanceable
//   the matchup   the pair that caught the player out - the actual hook, and
//                 the bit worth replying to
//
// Spoiler-safe: naming the two entities never reveals which is higher, so the
// reader still has to play to find out.
// ============================================================================

import { LIVE_MODES } from "@/lib/modes";

export interface ChainShare {
  reached: number;
  rounds: number;
  wrongRounds: number[];
  topic?: string;
  missed?: [string, string];
}

/** The run as ticks and crosses, in the order they were played. */
export function runGlyphs(reached: number, rounds: number, wrongRounds: number[]): string {
  const total = Math.max(0, Math.min(rounds, 20));
  if (total === 0) return "";
  const wrong = new Set(wrongRounds);
  // Rounds only ever end at the last pair, so everything up to `played` was
  // actually attempted; anything beyond it was never reached.
  const played = Math.min(total, reached + wrongRounds.length);
  let out = "";
  for (let i = 0; i < played; i++) out += wrong.has(i) ? "❌" : "✅";
  return out;
}

export interface ShareInput {
  date: string;
  /** Display date, already formatted by the caller. */
  dateLabel: string;
  chain: ChainShare | null;
  /** Points per mode id, for the quick games. */
  modeScores: Record<string, { points: number; played: boolean }>;
  origin: string;
}

export function buildShareText({ dateLabel, chain, modeScores, origin }: ShareInput): string {
  const lines: string[] = [];

  // --- Chain leads -----------------------------------------------------------
  if (chain && chain.rounds > 0) {
    lines.push(`WhoHadMore · ${chain.topic ?? dateLabel}`);
    const run = runGlyphs(chain.reached, chain.rounds, chain.wrongRounds);
    lines.push(`${run} ${chain.reached}/${chain.rounds}`.trim());
    if (chain.missed) {
      lines.push(`Got me: ${chain.missed[0]} vs ${chain.missed[1]}`);
    } else if (chain.reached >= chain.rounds) {
      lines.push("Clean sweep - didn't miss one.");
    }
  } else {
    lines.push(`WhoHadMore · ${dateLabel}`);
  }

  // --- the rest of the card, compact ----------------------------------------
  const quick = LIVE_MODES.filter((m) => m.id !== "chain")
    .map((m) => ({ name: m.name, ...(modeScores[m.id] ?? { points: 0, played: false }) }))
    .filter((m) => m.played);
  if (quick.length) {
    lines.push(quick.map((m) => `${m.name} ${m.points.toLocaleString()}`).join(" · "));
  }

  lines.push(origin);
  return lines.join("\n");
}
