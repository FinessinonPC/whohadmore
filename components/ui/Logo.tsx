// The Crown Chip - WhoHadMore's mark. A cream game chip with a heavy ink
// outline, hand-placed tilt, hard shadow, and a gold crown: "who had more?"
// -> whoever's #1. Gold matches the leaderboard's first-place medal color.

interface MarkProps {
  className?: string;
  /** pixel size of the square mark */
  size?: number;
}

export function BrandMark({ className = "", size }: MarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="WhoHadMore"
    >
      <g transform="rotate(-6 50 50)">
        <rect x="18" y="22" width="68" height="68" rx="15" fill="#000000" opacity="0.4" />
        <rect x="14" y="18" width="68" height="68" rx="15" fill="#F6F1E3" stroke="#16181D" strokeWidth="6.5" />
        <path
          d="M 28 66 L 25 38 L 39 49 L 48 33 L 57 49 L 71 38 L 68 66 Z"
          fill="#FFB300"
          stroke="#16181D"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Glyph + condensed uppercase wordmark used in page headers. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark className="h-[20px] w-[20px]" />
      <span className="text-[17px] font-condensed font-bold uppercase tracking-wide text-ink mt-0.5">
        WHOHADMORE
      </span>
    </span>
  );
}
