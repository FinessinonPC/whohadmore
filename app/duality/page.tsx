import type { Metadata } from "next";
import { DualityGame } from "@/components/games/DualityGame";
import { getDualityContent } from "@/lib/minigames";
import { gameSeo } from "@/lib/gameSeo";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * /duality - today's Duality, playable on arrival.
 *
 * Renders the game rather than redirecting to /duality/<today>. A redirect
 * cannot rank: Google indexes the destination, and the dated route is
 * noindexed as a duplicate. So the bare URL is the only one that can win
 * "duality whohadmore" - and it should land a searcher on the puzzle, not on
 * prose about the puzzle, and not on a card from three weeks ago.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = gameSeo("duality");
  const title = seo?.seoTitle ?? "Duality";
  const description = seo?.metaDescription ?? "Play today's Duality on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: "/duality" },
    openGraph: { title, description, url: "/duality" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DualityTodayPage() {
  const date = todayISO();
  const day = await getDualityContent(date);
  return <DualityGame day={day} date={date} />;
}
