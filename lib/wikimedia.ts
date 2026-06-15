// ============================================================================
// Wikimedia image utilities
//
// Browser code must NEVER hit Wikipedia directly (CORS + rate limits). It calls
// our own proxy at /api/wikimedia via `fetchImageForEntity`. The proxy route
// uses `getWikimediaThumbnail`, which talks to the Wikipedia REST API.
// ============================================================================

const REST_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";

// Wikimedia asks API clients to identify themselves with a descriptive UA.
const USER_AGENT =
  "WhoHadMore/1.0 (daily higher-lower trivia game; contact via repo)";

/**
 * Server-side: fetch the lead thumbnail for a Wikipedia title.
 * Returns the image URL, or null when there's no usable thumbnail.
 */
export async function getWikimediaThumbnail(
  query: string
): Promise<string | null> {
  const title = query.trim();
  if (!title) return null;

  // The REST API expects underscores for spaces; encode the rest.
  const slug = encodeURIComponent(title.replace(/\s+/g, "_"));

  try {
    const res = await fetch(`${REST_SUMMARY}${slug}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      // Cache aggressively — entity images rarely change.
      next: { revalidate: 60 * 60 * 24 },
    });

    if (res.ok) {
      const data = (await res.json()) as {
        thumbnail?: { source?: string };
        originalimage?: { source?: string };
      };
      const direct = data.thumbnail?.source ?? data.originalimage?.source ?? null;
      if (direct) return direct;
    }
  } catch {
    /* fall through to search */
  }

  // No exact-title hit — fall back to a search so near-misses still resolve.
  const results = await searchWikimediaImages(title);
  return results[0]?.imageUrl ?? null;
}

export interface WikimediaResult {
  title: string;
  imageUrl: string;
}

/**
 * Server-side: search Wikipedia and return several candidate images (ranked by
 * search relevance). Powers the admin image picker's "pick from results" grid.
 */
export async function searchWikimediaImages(
  query: string,
  limit = 9
): Promise<WikimediaResult[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: q,
    gsrlimit: String(limit),
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "400",
  });

  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { title: string; index: number; thumbnail?: { source?: string } }
        >;
      };
    };

    const pages = Object.values(data.query?.pages ?? {});
    return pages
      .filter((p) => p.thumbnail?.source)
      .sort((a, b) => a.index - b.index)
      .map((p) => ({ title: p.title, imageUrl: p.thumbnail!.source! }));
  } catch {
    return [];
  }
}

/**
 * Browser-side: ask our own proxy for an entity's image.
 * Always goes through /api/wikimedia, never directly to Wikipedia.
 */
export async function fetchImageForEntity(
  query: string
): Promise<string | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(`/api/wikimedia?query=${encodeURIComponent(trimmed)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { imageUrl: string | null };
    return data.imageUrl ?? null;
  } catch {
    return null;
  }
}

/** Browser-side: fetch several candidate images for a query (via our proxy). */
export async function searchImagesForEntity(
  query: string
): Promise<WikimediaResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  try {
    const res = await fetch(
      `/api/wikimedia/search?query=${encodeURIComponent(trimmed)}`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results: WikimediaResult[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

/** Initials fallback shown when no image is available (e.g. "Magic Johnson" -> "MJ"). */
export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
