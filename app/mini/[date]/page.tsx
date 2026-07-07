import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MiniGame } from "@/components/games/MiniGame";
import { getMiniContent } from "@/lib/minigames";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const title = "Mini";
  const description =
    "A bite-size 5x5 crossword every day - fill the grid, beat the check. Free on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: `/mini/${date}` },
    openGraph: { title, description, url: `/mini/${date}` },
  };
}

export default async function MiniPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  const day = await getMiniContent(date);
  return <MiniGame day={day} date={date} />;
}
