// ============================================================================
// Game icons - one consistent, professional set. Rules (see docs/BLUEPRINT.md):
// 24px grid, filled geometric shapes only (no thin strokes), rounded corners,
// duotone: the game's accent at full strength + the same accent at ~35% for the
// secondary shape. Icons must read at 20px.
// ============================================================================

import type { ModeId } from "@/lib/modes";

interface IconProps {
  accent: string;
  className?: string;
}

/** Higher or Lower: the brand motif - up beats down. */
export function ChainIcon({ accent, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 3.2 L18.6 11 H5.4 Z" fill={accent} />
      <path d="M5.4 13 H18.6 L12 20.8 Z" fill={accent} opacity="0.35" />
    </svg>
  );
}

/** Rank: a podium - order matters. */
export function RankIcon({ accent, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="9.4" y="4" width="5.2" height="16" rx="2" fill={accent} />
      <rect x="2.8" y="9.5" width="5.2" height="10.5" rx="2" fill={accent} opacity="0.55" />
      <rect x="16" y="13.5" width="5.2" height="6.5" rx="2" fill={accent} opacity="0.35" />
    </svg>
  );
}

/** Pinpoint: a target - land the exact number. */
export function PinpointIcon({ accent, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" fill={accent} opacity="0.25" />
      <circle cx="12" cy="12" r="5.6" fill={accent} opacity="0.45" />
      <circle cx="12" cy="12" r="2.6" fill={accent} />
    </svg>
  );
}

/** Recall: two cards - remember what was where. */
export function RecallIcon({ accent, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3.4" y="5.6" width="10.5" height="14" rx="2.6" fill={accent} opacity="0.35" transform="rotate(-8 8.65 12.6)" />
      <rect x="10" y="4.4" width="10.5" height="14" rx="2.6" fill={accent} transform="rotate(7 15.25 11.4)" />
      <circle cx="15.4" cy="9.4" r="1.7" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

/** Duality: two worlds, one line between them. */
export function DualityIcon({ accent, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 3 a9 9 0 0 0 0 18 Z" fill={accent} />
      <path d="M12 3 a9 9 0 0 1 0 18 Z" fill={accent} opacity="0.35" />
      <circle cx="12" cy="8" r="1.8" fill="#FFFFFF" opacity="0.9" />
      <circle cx="12" cy="16" r="1.8" fill={accent} />
    </svg>
  );
}

/** Impostor: three fit, one doesn't. */
export function ImpostorIcon({ accent, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3.4" y="3.4" width="8" height="8" rx="2.4" fill={accent} opacity="0.35" />
      <rect x="12.6" y="3.4" width="8" height="8" rx="2.4" fill={accent} opacity="0.35" />
      <rect x="3.4" y="12.6" width="8" height="8" rx="2.4" fill={accent} opacity="0.35" />
      <circle cx="16.6" cy="16.6" r="4.2" fill={accent} />
    </svg>
  );
}

/** Split: over or under the line. */
export function SplitIcon({ accent, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2.8 L17.6 9 H6.4 Z" fill={accent} />
      <rect x="4" y="10.8" width="16" height="2.4" rx="1.2" fill={accent} opacity="0.5" />
      <path d="M6.4 15 H17.6 L12 21.2 Z" fill={accent} opacity="0.35" />
    </svg>
  );
}

/** Blitz: beat the clock. */
export function BlitzIcon({ accent, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M13.6 2.5 L5.4 13.4 H11l-1.6 8.1 8.2-10.9H12 Z" fill={accent} />
    </svg>
  );
}

const ICONS: Record<ModeId, (p: IconProps) => React.ReactNode> = {
  chain: ChainIcon,
  duality: DualityIcon,
  rank: RankIcon,
  impostor: ImpostorIcon,
  pinpoint: PinpointIcon,
  recall: RecallIcon,
  split: SplitIcon,
};

/** The icon for a mode, sized by className (defaults follow the tile spec). */
export function GameIcon({
  mode,
  accent,
  className = "h-6 w-6",
}: IconProps & { mode: ModeId }) {
  const Icon = ICONS[mode];
  return <Icon accent={accent} className={className} />;
}

/** The accent-tinted rounded square that houses a game icon on tiles. */
export function GameIconTile({
  mode,
  accent,
  size = "h-14 w-14",
  iconSize = "h-7 w-7",
}: {
  mode: ModeId;
  accent: string;
  size?: string;
  iconSize?: string;
}) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-2xl`}
      style={{ background: `${accent}17` }}
    >
      <GameIcon mode={mode} accent={accent} className={iconSize} />
    </span>
  );
}
