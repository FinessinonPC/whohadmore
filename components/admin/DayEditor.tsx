"use client";

import Link from "next/link";
import { Reorder } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { CardEditor } from "./CardEditor";
import { ImagePicker } from "./ImagePicker";
import { AiPromptPanel } from "./AiPromptPanel";
import { PreviewPlayer } from "./PreviewPlayer";
import { CARD_COUNT, emptyCard, padToCount, type DraftCard } from "./draft";
import { Button } from "@/components/ui/Button";
import { Badge, categoryLabel } from "@/components/ui/Badge";
import { adminFetch } from "@/lib/adminClient";
import { fetchImageForEntity, initialsFor } from "@/lib/wikimedia";
import { formatDisplayDate } from "@/lib/date";
import { formatStat } from "@/lib/gameLogic";
import {
  TOPIC_CATEGORIES,
  type AiGameJson,
  type FullGame,
  type ImageSource,
  type SaveGamePayload,
  type TopicCategory,
} from "@/types";

interface DayEditorProps {
  date: string;
}

export function DayEditor({ date }: DayEditorProps) {
  const [topicLabel, setTopicLabel] = useState("");
  const [category, setCategory] = useState<TopicCategory>("sports");
  const [statLabel, setStatLabel] = useState("");
  const [statUnit, setStatUnit] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<DraftCard[]>(() =>
    padToCount([])
  );
  const [savedPublished, setSavedPublished] = useState(false);
  const [exists, setExists] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // --- Load existing game (incl. drafts) -----------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await adminFetch(`/api/admin/game/${date}`);
        const data = (await res.json()) as { game?: FullGame | null };
        if (cancelled) return;
        const game = data.game;
        if (game) {
          setTopicLabel(game.topic_label);
          setCategory((game.topic_category as TopicCategory) ?? "sports");
          setStatLabel(game.stat_label);
          setStatUnit(game.stat_unit ?? "");
          setDescription(game.description ?? "");
          setSavedPublished(game.published);
          setExists(true);
          setCards(
            padToCount(
              game.cards.map((c) => ({
                key: c.id,
                entity_name: c.entity_name,
                stat_value: String(c.stat_value),
                image_url: c.image_url,
                image_source: c.image_source,
                loading: false,
              }))
            )
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  // --- Card helpers ---------------------------------------------------------
  const updateByKey = useCallback((key: string, patch: Partial<DraftCard>) => {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }, []);

  const fetchImageFor = useCallback(
    async (key: string, name: string, source: ImageSource = "wikimedia") => {
      if (!name.trim()) return;
      updateByKey(key, { loading: true });
      const url = await fetchImageForEntity(name);
      updateByKey(key, {
        loading: false,
        ...(url ? { image_url: url, image_source: source } : {}),
      });
    },
    [updateByKey]
  );

  const handleEntityBlur = useCallback(
    (card: DraftCard) => {
      // Auto-fetch only when there's no manual override in place.
      if (card.entity_name.trim() && card.image_source !== "manual") {
        void fetchImageFor(card.key, card.entity_name);
      }
    },
    [fetchImageFor]
  );

  // --- AI load: populate everything + fetch all images at once --------------
  const loadAiGame = useCallback((game: AiGameJson) => {
    setTopicLabel(game.topic_label);
    setCategory(game.topic_category);
    setStatLabel(game.stat_label);
    setStatUnit(game.stat_unit);
    setDescription(game.description ?? "");

    const next = padToCount(
      game.cards.slice(0, CARD_COUNT).map((c) => ({
        key: crypto.randomUUID(),
        entity_name: c.entity_name,
        stat_value: String(c.stat_value),
        image_url: null,
        image_source: "wikimedia" as ImageSource,
        loading: Boolean(c.entity_name.trim()),
      }))
    );
    setCards(next);

    // Fire all Wikimedia lookups simultaneously.
    next.forEach((card) => {
      if (!card.entity_name.trim()) return;
      fetchImageForEntity(card.entity_name).then((url) =>
        updateByKey(card.key, {
          loading: false,
          ...(url ? { image_url: url, image_source: "wikimedia" } : {}),
        })
      );
    });
  }, [updateByKey]);

  // --- Persistence ----------------------------------------------------------
  function buildPayload(published: boolean): SaveGamePayload {
    return {
      play_date: date,
      topic_label: topicLabel,
      topic_category: category,
      stat_label: statLabel,
      stat_unit: statUnit || null,
      description: description.trim() || null,
      published,
      cards: cards.map((c, i) => ({
        position: i,
        entity_name: c.entity_name,
        stat_value: Number(c.stat_value),
        image_url: c.image_url,
        image_source: c.image_source,
      })),
    };
  }

  async function save(published: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await adminFetch("/api/admin/save-game", {
        method: "POST",
        body: JSON.stringify(buildPayload(published)),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; cards?: number };
      if (res.ok && data.ok) {
        setExists(true);
        setSavedPublished(published);
        setMessage({ ok: true, text: `Saved ${data.cards ?? 0} cards.` });
      } else {
        setMessage({ ok: false, text: data.error ?? "Save failed" });
      }
    } catch {
      setMessage({ ok: false, text: "Network error while saving" });
    } finally {
      setSaving(false);
    }
  }

  async function setPublishState(next: boolean) {
    // If the game exists, flip just the flag; otherwise create it via save.
    if (!exists) {
      await save(next);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await adminFetch("/api/admin/publish", {
        method: "POST",
        body: JSON.stringify({ play_date: date, published: next }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setSavedPublished(next);
        setMessage({ ok: true, text: next ? "Published." : "Unpublished." });
      } else {
        setMessage({ ok: false, text: data.error ?? "Failed" });
      }
    } finally {
      setSaving(false);
    }
  }

  const filledCount = cards.filter(
    (c) => c.entity_name.trim() && c.stat_value.trim()
  ).length;

  // Build a playable game from the current draft (filled rows only) for preview.
  function buildPreviewGame(): FullGame {
    const filled = cards.filter((c) => c.entity_name.trim() && c.stat_value.trim());
    const now = new Date().toISOString();
    return {
      id: "preview",
      play_date: date,
      topic_label: topicLabel || "Untitled",
      topic_category: category,
      stat_label: statLabel || "Stat",
      stat_unit: statUnit || null,
      description: description.trim() || null,
      published: false,
      created_at: now,
      cards: filled.map((c, i) => ({
        id: c.key,
        game_id: "preview",
        position: i,
        entity_name: c.entity_name.trim(),
        stat_value: Number(c.stat_value),
        image_url: c.image_url,
        image_source: c.image_source,
        created_at: now,
      })),
    };
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <Link href="/admin" className="text-sm font-semibold text-ink-secondary hover:text-ink">
          ‹ Calendar
        </Link>
        <div className="flex items-center gap-3">
          <Badge tone={savedPublished ? "live" : "draft"}>
            {savedPublished ? "Published" : "Draft"}
          </Badge>
          <span className="text-sm font-semibold text-ink">
            {formatDisplayDate(date)}
          </span>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr,360px]">
        {/* LEFT - editor */}
        <div>
          {/* Meta fields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Topic label" className="sm:col-span-2">
              <input
                value={topicLabel}
                onChange={(e) => setTopicLabel(e.target.value)}
                placeholder="NBA Scoring Leaders 2024-25"
                className="editor-input"
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TopicCategory)}
                className="editor-input"
              >
                {TOPIC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stat label">
              <input
                value={statLabel}
                onChange={(e) => setStatLabel(e.target.value)}
                placeholder="Points Per Game"
                className="editor-input"
              />
            </Field>
            <Field label="Stat unit">
              <input
                value={statUnit}
                onChange={(e) => setStatUnit(e.target.value)}
                placeholder="PPG"
                className="editor-input"
              />
            </Field>
            <Field label="SEO description (optional)" className="sm:col-span-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="1-2 sentences for search engines. Leave blank to auto-generate from the topic and stat."
                className="editor-input resize-y"
              />
            </Field>
          </div>

          {/* Card list */}
          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">
              Cards <span className="text-ink-secondary">({filledCount}/{CARD_COUNT})</span>
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                disabled={filledCount < 2}
                title={filledCount < 2 ? "Add at least 2 cards to preview" : "Play this game"}
              >
                Preview
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setAiOpen(true)}>
                Generate with AI
              </Button>
            </div>
          </div>

          <Reorder.Group
            axis="y"
            values={cards}
            onReorder={setCards}
            className="mt-3 flex flex-col gap-2"
          >
            {cards.map((card, i) => (
              <CardEditor
                key={card.key}
                card={card}
                index={i}
                onChange={(patch) => updateByKey(card.key, patch)}
                onEntityBlur={() => handleEntityBlur(card)}
                onOpenPicker={() => setPickerIndex(i)}
              />
            ))}
          </Reorder.Group>

          {/* Actions */}
          <div className="sticky bottom-0 mt-6 flex items-center gap-3 border-t border-border bg-background/90 py-4 backdrop-blur">
            <Button variant="secondary" onClick={() => save(savedPublished)} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button onClick={() => setPublishState(!savedPublished)} disabled={saving}>
              {savedPublished ? "Unpublish" : "Publish"}
            </Button>
            {message && (
              <span className={`text-xs font-semibold ${message.ok ? "text-correct" : "text-wrong"}`}>
                {message.text}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT - preview */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-3 small-caps text-[10px] text-ink-secondary">Preview</p>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-center small-caps text-xs text-ink-secondary">
              {topicLabel || "Topic label"}
            </p>
            <p className="mt-0.5 text-center text-[13px] text-ink-secondary">
              {statLabel || "Stat label"}
            </p>
            <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto no-scrollbar">
              {cards
                .filter((c) => c.entity_name.trim())
                .map((c, i) => (
                  <div
                    key={c.key}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background p-2"
                  >
                    <span className="w-4 text-center text-[11px] font-semibold text-ink-secondary">
                      {i + 1}
                    </span>
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-border/40">
                      {c.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-ink-secondary">
                          {initialsFor(c.entity_name)}
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                      {c.entity_name}
                    </span>
                    <span className="tabular text-sm font-bold text-ink">
                      {c.stat_value ? formatStat(Number(c.stat_value)) : "-"}
                    </span>
                  </div>
                ))}
              {filledCount === 0 && (
                <p className="py-8 text-center text-xs text-ink-secondary">
                  Add entities to preview the deck.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ImagePicker
        open={pickerIndex !== null}
        card={pickerIndex !== null ? cards[pickerIndex] : null}
        onClose={() => setPickerIndex(null)}
        onConfirm={(url, source) => {
          if (pickerIndex !== null) {
            updateByKey(cards[pickerIndex].key, { image_url: url, image_source: source });
          }
          setPickerIndex(null);
        }}
      />

      <AiPromptPanel open={aiOpen} onClose={() => setAiOpen(false)} onLoad={loadAiGame} />

      {previewOpen && (
        <PreviewPlayer
          game={buildPreviewGame()}
          date={date}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </main>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="small-caps text-[10px] text-ink-secondary">{label}</span>
      {children}
    </label>
  );
}
