import type { ImageSource } from "@/types";

// Editor-only working shape for a card. stat_value is a string while it lives
// in an <input>; it's parsed to a number on save.
export interface DraftCard {
  key: string;
  entity_name: string;
  stat_value: string;
  image_url: string | null;
  image_source: ImageSource | null;
  loading: boolean;
}

export const CARD_COUNT = 15;

export function emptyCard(): DraftCard {
  return {
    key: crypto.randomUUID(),
    entity_name: "",
    stat_value: "",
    image_url: null,
    image_source: null,
    loading: false,
  };
}

/** Always work with exactly CARD_COUNT rows: pad short, keep the rest. */
export function padToCount(cards: DraftCard[]): DraftCard[] {
  const out = [...cards];
  while (out.length < CARD_COUNT) out.push(emptyCard());
  return out;
}
