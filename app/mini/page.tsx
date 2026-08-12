import type { Metadata } from "next";
import { MiniGame } from "@/components/games/MiniGame";
import { getMiniContent } from "@/lib/minigames";
import { gameSeo } from "@/lib/gameSeo";
import { GameBelowFold } from "@/components/seo/GameBelowFold";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * /mini - today's Mini, playable on arrival. See app/chain/page.tsx for why
 * these render the game instead of redirecting to the dated route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = gameSeo("mini");
  const title = seo?.seoTitle ?? "Mini";
  const description = seo?.metaDescription ?? "Play today's Mini on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: "/mini" },
    openGraph: { title, description, url: "/mini" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MiniTodayPage() {
  const date = todayISO();
  const day = await getMiniContent(date);
  return (
    <>
      <MiniGame day={day} date={date} />
      <GameBelowFold id="mini" />
    </>
  );
}
