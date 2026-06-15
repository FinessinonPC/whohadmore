"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { fetchImageForEntity, initialsFor } from "@/lib/wikimedia";
import type { ImageSource } from "@/types";
import type { DraftCard } from "./draft";

interface ImagePickerProps {
  open: boolean;
  card: DraftCard | null;
  onClose: () => void;
  onConfirm: (url: string, source: ImageSource) => void;
}

export function ImagePicker({ open, card, onClose, onConfirm }: ImagePickerProps) {
  const [urlInput, setUrlInput] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ url: string; source: ImageSource } | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Reset to the card's current state each time the picker opens.
  useEffect(() => {
    if (open && card) {
      setUrlInput("");
      setQuery(card.entity_name);
      setPending(card.image_url ? { url: card.image_url, source: card.image_source ?? "manual" } : null);
      setNotFound(false);
    }
  }, [open, card]);

  async function search() {
    setSearching(true);
    setNotFound(false);
    const url = await fetchImageForEntity(query);
    setSearching(false);
    if (url) setPending({ url, source: "wikimedia" });
    else setNotFound(true);
  }

  const previewUrl = pending?.url ?? null;

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="text-lg font-extrabold text-ink">Card image</h2>
      <p className="mt-0.5 text-sm text-ink-secondary">
        {card?.entity_name || "Untitled"}
      </p>

      {/* Large preview */}
      <div className="mx-auto mt-5 h-44 w-44 overflow-hidden rounded-2xl border border-border bg-border/40">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-ink-secondary">
            {card?.entity_name ? initialsFor(card.entity_name) : "—"}
          </div>
        )}
      </div>

      {/* Search Wikimedia */}
      <div className="mt-6">
        <label className="small-caps text-[10px] text-ink-secondary">Search Wikimedia</label>
        <div className="mt-1 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wikipedia title"
            className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-ink"
          />
          <Button variant="secondary" onClick={search} disabled={searching || !query.trim()}>
            {searching ? "…" : "Search"}
          </Button>
        </div>
        {notFound && <p className="mt-1 text-xs text-wrong">No image found for that title.</p>}
      </div>

      {/* Paste URL */}
      <div className="mt-4">
        <label className="small-caps text-[10px] text-ink-secondary">Or paste an image URL</label>
        <div className="mt-1 flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://…"
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
        <Button
          onClick={() => pending && onConfirm(pending.url, pending.source)}
          disabled={!pending}
        >
          Confirm
        </Button>
      </div>
    </Sheet>
  );
}
