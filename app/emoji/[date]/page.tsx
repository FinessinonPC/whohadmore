import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmojiGame } from "@/components/games/EmojiGame";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const title = "Emoji";
  const description =
    "Five pictures-only puzzles a day - decode the movie, show, or phrase from emojis. Free on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: `/emoji/${date}` },
    openGraph: { title, description, url: `/emoji/${date}` },
  };
}

export default async function EmojiPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  return <EmojiGame date={date} />;
}
