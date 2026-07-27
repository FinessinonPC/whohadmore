import { notFound } from "next/navigation";
import { GAME_SEO, gameSeo } from "@/lib/gameSeo";
import { modeDef } from "@/lib/modes";
import { OG_SIZE, titleCard } from "@/lib/shareCard";

export const alt = "WhoHadMore daily game";
export const size = OG_SIZE;
export const contentType = "image/png";

// Evergreen copy -> the card never changes, so it can be generated once at
// build time and cached forever. No date stamping needed (unlike the homepage
// card, which has to bust link-preview caches daily).
export const dynamic = "force-static";

export function generateStaticParams() {
  return GAME_SEO.map((g) => ({ game: g.id }));
}

export default async function GameOgImage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  const seo = gameSeo(game);
  if (!seo) notFound();
  const def = modeDef(seo.id);
  return titleCard(def.name, seo.standfirst, def.accent);
}
