// Clean, hand-built brand mark — two bars (one taller, green) reading as a
// higher/lower comparison. No external assets; scales crisply at any size.

interface MarkProps {
  className?: string;
  /** pixel size of the square mark */
  size?: number;
}

export function BrandMark({ className = "", size }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="WhoHadMore"
    >
      <rect width="64" height="64" rx="16" fill="#111111" />
      {/* up = higher (green), down = lower (dim) */}
      <path
        d="M18 29 L32 16 L46 29"
        fill="none"
        stroke="#00C853"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 35 L32 48 L46 35"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.5"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icon + wordmark lockup used in page headers. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark className="h-5 w-5" />
      <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
    </span>
  );
}
