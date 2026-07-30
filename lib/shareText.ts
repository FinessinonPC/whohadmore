// ============================================================================
// What a player posts.
//
// Four lines, and every one earns its place:
//
//   the topic   what today was about, so the post has a subject
//   the run     🟩🟥 in the order played - the glanceable bit, and the only
//               part that survives being seen at thumbnail size
//   the numbers the total, and the share of players it beat. Two numbers,
//               because a total alone means nothing to someone who has never
//               played and "beat 67%" is the part worth bragging about
//   the link
//
// Deliberately NOT here: a per-game breakdown. Four game names and four scores
// is a table, and nobody reads a table in a group chat.
//
// Spoiler-safe: the run shows only whether each call was right, never which
// side it was, so a reader still has to play.
// ============================================================================

export interface ChainShare {
  reached: number;
  rounds: number;
  wrongRounds: number[];
  topic?: string;
}

/** The run as coloured blocks, in the order played. */
export function runGlyphs(reached: number, rounds: number, wrongRounds: number[]): string {
  const total = Math.max(0, Math.min(rounds, 20));
  if (total === 0) return "";
  const wrong = new Set(wrongRounds);
  // A chain only ends at the last pair, so everything up to `played` was
  // attempted; anything past it was never reached.
  const played = Math.min(total, reached + wrongRounds.length);
  let out = "";
  for (let i = 0; i < played; i++) out += wrong.has(i) ? "🟥" : "🟩";
  return out;
}

export interface ShareInput {
  /** Display date, already formatted - the fallback header when there's no topic. */
  dateLabel: string;
  chain: ChainShare | null;
  /** Combined score for the day. */
  total: number;
  /** Share of today's other players this beat, or null while unknown. */
  beatPct: number | null;
  origin: string;
}

export function buildShareText({ dateLabel, chain, total, beatPct, origin }: ShareInput): string {
  const lines: string[] = [`WhoHadMore · ${chain?.topic ?? dateLabel}`];

  if (chain && chain.rounds > 0) {
    const run = runGlyphs(chain.reached, chain.rounds, chain.wrongRounds);
    if (run) lines.push(run);
  }

  const score = `${total.toLocaleString()} points`;
  lines.push(beatPct === null ? score : `${score} · beat ${beatPct}% of players`);
  lines.push(origin);

  return lines.join("\n");
}
