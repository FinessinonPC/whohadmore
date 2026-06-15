"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import {
  initialsFor,
  searchImagesForEntity,
  type WikimediaResult,
} from "@/lib/wikimedia";
import type { ImageSource } from "@/types";
import type { DraftCard } from "./draft";

interface ImagePickerProps {
  open: boolean;
  card: DraftCard | null;
  onClose: () => void;
  onConfirm: (url: string, source: ImageSource) => void;
}

export function ImagePicker({ open, card, onClose, onConfirm }: ImagePickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikimediaResult[]>([]);
  const [pending, setPending] = useState<{ url: string; source: ImageSource } | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [searching, setSearching] = useState(false);

  async function runSearch(q: string) {
    setSearching(true);
    const found = await searchImagesForEntity(q);
    setResults(found);
    setSearching(false);
  }

  // On open: seed from the card and auto-search its name.
  useEffect(() => {
    if (open && card) {
      setQuery(card.entity_name);
      setUrlInput("");
      setResults([]);
      setPending(
        card.image_url ? { url: card.image_url, source: card.image_source ?? "manual" } : null
      );
      if (card.entity_name.trim()) void runSearch(card.entity_name);
    }
  }, [open, card]);

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="text-lg font-extrabold text-ink">Card image</h2>
      <p className="mt-0.5 text-sm text-ink-secondary">{card?.entity_name || "Untitled"}</p>

      {/* Search */}
      <div className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && runSearch(query)}
          placeholder="Search Wikipedia"
          className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-ink"
        />
        <Button variant="secondary" onClick={() => runSearch(query)} disabled={searching || !query.trim()}>
          {searching ? "…" : "Search"}
        </Button>
      </div>

      {/* Results grid — click to pick */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {searching && results.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-surface" />
          ))
        ) : results.length > 0 ? (
          results.map((r) => {
            const selected = pending?.url === r.imageUrl;
            return (
              <button
                key={r.imageUrl}
                type="button"
                title={r.title}
                onClick={() => setPending({ url: r.imageUrl, source: "wikimedia" })}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                  selected ? "border-ink" : "border-transparent hover:border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover" />
              </button>
            );
          })
        ) : (
          <div className="col-span-3 flex h-24 items-center justify-center rounded-lg bg-surface text-xs text-ink-secondary">
            {card?.entity_name ? "No results — try a different search or paste a URL." : "Search to find images."}
          </div>
        )}
      </div>

      {/* Selected preview + paste URL */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-border/40">
          {pending?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pending.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-ink-secondary">
              {card?.entity_name ? initialsFor(card.entity_name) : "—"}
            </div>
          )}
        </div>
        <div className="flex flex-1 gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="…or paste an image URL"
            className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-ink"
          />
          <Button
            variant="secondary"
            onClick={() => urlInput.trim() && setPending({ url: urlInput.trim(), source: "manual" })}
            disabled={!urlInput.trim()}
          >
            Use
          </Button>
        </div>
      </div>

      {/* Confirm / cancel */}
      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => pending && onConfirm(pending.url, pending.source)} disabled={!pending}>
          Confirm
        </Button>
      </div>
    </Sheet>
  );
}
