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
      {/* two cards compared — the right one "had more" (taller, green) */}
      <rect x="14" y="24" width="15" height="24" rx="3" fill="#FFFFFF" fillOpacity="0.5" />
      <rect x="35" y="13" width="15" height="35" rx="3" fill="#00C853" />
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
