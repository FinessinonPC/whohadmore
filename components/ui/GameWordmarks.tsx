// ============================================================================
// Per-game WORDMARKS - the game's name IS its logo, with one custom letter
// that plays the game's own trick. Set in the condensed display face. This is
// how real daily games brand themselves (a letter that behaves), not icons in
// tinted squares.
//
// Every wordmark inherits `color` from its parent; pass `alt` for the accent
// used by the trick letter where one is needed.
// ============================================================================

import type { ModeId } from "@/lib/modes";

interface WordmarkProps {
  /** Tailwind text size utilities, e.g. "text-5xl" */
  className?: string;
  /** Color for the trick letter / second voice, where the mark uses one. */
  alt?: string;
}

const base =
  "inline-flex items-baseline font-condensed font-semibold uppercase leading-none tracking-wide";

/** CHAIN - the A is the up-triangle. */
export function ChainWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Chain">
      <span>CH</span>
      <svg viewBox="0 0 56 56" className="mx-[0.02em] h-[0.74em] w-auto self-center" aria-hidden>
        <polygon points="28,2 2,54 54,54" fill={alt ?? "currentColor"} />
      </svg>
      <span>IN</span>
    </span>
  );
}

/** DUALITY - the word itself is split between two voices. */
export function DualityWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Duality">
      <span>DUAL</span>
      <span style={{ color: alt ?? "currentColor", opacity: alt ? 1 : 0.45 }}>ITY</span>
    </span>
  );
}

/** RANK - the letters climb the podium. */
export function RankWordmark({ className = "" }: WordmarkProps) {
  const steps = [
    { ch: "R", y: "0.12em" },
    { ch: "A", y: "0.04em" },
    { ch: "N", y: "-0.04em" },
    { ch: "K", y: "-0.12em" },
  ];
  return (
    <span className={`${base} ${className}`} aria-label="Rank">
      {steps.map((s, i) => (
        <span key={i} className="inline-block" style={{ transform: `translateY(${s.y})` }}>
          {s.ch}
        </span>
      ))}
    </span>
  );
}

/** IMPOSTOR - one letter doesn't belong. */
export function ImpostorWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Impostor">
      <span>IMPOST</span>
      <span
        className="inline-block"
        style={{ transform: "rotate(10deg) translateY(-0.03em)", color: alt ?? "currentColor" }}
      >
        O
      </span>
      <span>R</span>
    </span>
  );
}

/** PINPOINT - the first O is the target. */
export function PinpointWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Pinpoint">
      <span>PINP</span>
      <svg viewBox="0 0 56 56" className="mx-[0.03em] h-[0.66em] w-auto self-center" aria-hidden>
        <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="9" />
        <circle cx="28" cy="28" r="9" fill={alt ?? "currentColor"} />
      </svg>
      <span>INT</span>
    </span>
  );
}

/** RECALL - the tail of the word fades like a memory. */
export function RecallWordmark({ className = "" }: WordmarkProps) {
  const fade = [1, 1, 1, 0.85, 0.65, 0.4];
  return (
    <span className={`${base} ${className}`} aria-label="Recall">
      {"RECALL".split("").map((ch, i) => (
        <span key={i} style={{ opacity: fade[i] }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** SPLIT - the I is the line everything divides over. */
export function SplitWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Split">
      <span>SPL</span>
      <svg viewBox="0 0 30 56" className="mx-[0.05em] h-[0.72em] w-auto self-center" aria-hidden>
        <rect x="10" y="0" width="10" height="24" rx="3" fill="currentColor" />
        <rect x="10" y="32" width="10" height="24" rx="3" fill={alt ?? "currentColor"} />
      </svg>
      <span>T</span>
    </span>
  );
}

const MARKS: Record<ModeId, (p: WordmarkProps) => React.ReactNode> = {
  chain: ChainWordmark,
  duality: DualityWordmark,
  rank: RankWordmark,
  impostor: ImpostorWordmark,
  pinpoint: PinpointWordmark,
  recall: RecallWordmark,
  split: SplitWordmark,
};

export function GameWordmark({
  mode,
  className,
  alt,
}: WordmarkProps & { mode: ModeId }) {
  const Mark = MARKS[mode];
  return <Mark className={className} alt={alt} />;
}
