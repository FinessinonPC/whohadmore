import type { Metadata } from "next";
import { WordGame } from "@/components/games/WordGame";
import { getWordContent } from "@/lib/minigames";
import { gameSeo } from "@/lib/gameSeo";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * /word - today's Word, playable on arrival. See app/chain/page.tsx for why
 * these render the game instead of redirecting to the dated route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = gameSeo("word");
  const title = seo?.seoTitle ?? "Word";
  const description = seo?.metaDescription ?? "Play today's Word on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: "/word" },
    openGraph: { title, description, url: "/word" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function WordTodayPage() {
  const date = todayISO();
  const answer = await getWordContent(date);
  return <WordGame answer={answer} date={date} />;
}
