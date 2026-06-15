"use client";

import { Reorder, useDragControls } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { initialsFor } from "@/lib/wikimedia";
import type { DraftCard } from "./draft";

interface CardEditorProps {
  card: DraftCard;
  index: number;
  onChange: (patch: Partial<DraftCard>) => void;
  onEntityBlur: () => void;
  onOpenPicker: () => void;
}

export function CardEditor({
  card,
  index,
  onChange,
  onEntityBlur,
  onOpenPicker,
}: CardEditorProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={card}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2"
    >
      {/* Drag handle */}
      <button
        type="button"
        aria-label="Drag to reorder"
        onPointerDown={(e) => controls.start(e)}
        className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-ink-secondary active:cursor-grabbing"
      >
        <span className="leading-none tracking-tighter">⋮⋮</span>
      </button>

      {/* Position number */}
      <span className="w-5 shrink-0 text-center text-xs font-semibold text-ink-secondary">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-border/40">
        {card.loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-ink" />
          </div>
        ) : card.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-ink-secondary">
            {card.entity_name ? initialsFor(card.entity_name) : "—"}
          </div>
        )}
      </div>

      {/* Entity name */}
      <input
        value={card.entity_name}
        onChange={(e) => onChange({ entity_name: e.target.value })}
        onBlur={onEntityBlur}
        placeholder="Entity name"
        className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ink"
      />

      {/* Stat value */}
      <input
        value={card.stat_value}
        onChange={(e) => onChange({ stat_value: e.target.value })}
        inputMode="decimal"
        placeholder="0"
        className="h-9 w-20 shrink-0 rounded-lg border border-border bg-background px-2.5 text-right text-sm tabular outline-none focus:border-ink"
      />

      {/* Source + override */}
      {card.image_source && (
        <Badge tone={card.image_source === "manual" ? "draft" : "neutral"} className="hidden sm:inline-flex">
          {card.image_source}
        </Badge>
      )}
      <button
        type="button"
        onClick={onOpenPicker}
        className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-secondary hover:bg-background"
      >
        Image
      </button>
    </Reorder.Item>
  );
}
