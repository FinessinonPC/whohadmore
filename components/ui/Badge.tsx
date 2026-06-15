import type { TopicCategory } from "@/types";

type Tone = "neutral" | "category" | "live" | "draft";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface text-ink-secondary border-border",
  category: "bg-surface text-ink border-border",
  live: "bg-correct/10 text-correct border-correct/20",
  draft: "bg-[#FFB300]/10 text-[#B07A00] border-[#FFB300]/30",
};

// Human-readable labels for the stored category slugs.
const CATEGORY_LABEL: Record<TopicCategory, string> = {
  sports: "Sports",
  geography: "Geography",
  entertainment: "Entertainment",
  science: "Science",
  current_events: "Current Events",
};

export function categoryLabel(category: TopicCategory | null): string {
  return category ? CATEGORY_LABEL[category] : "Uncategorized";
}

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
