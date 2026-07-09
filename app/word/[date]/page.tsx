import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WordGame } from "@/components/games/WordGame";
import { getWordContent } from "@/lib/minigames";
import { isValidISODate } from "@/lib/date";
import { requireDateAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const title = "Word";
  const description =
    "Six tries to find the daily five-letter word. The classic format, free on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: `/word/${date}` },
    openGraph: { title, description, url: `/word/${date}` },
  };
}

export default async function WordPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  await requireDateAccess(date);
  const answer = await getWordContent(date);
  return <WordGame answer={answer} date={date} />;
}
