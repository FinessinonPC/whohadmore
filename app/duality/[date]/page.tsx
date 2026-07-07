import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DualityGame } from "@/components/games/DualityGame";
import { getDualityContent } from "@/lib/minigames";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const title = "Duality";
  const description =
    "Two worlds, eight things - sort every one to its side. A quick daily sorting game on WhoHadMore, free in your browser.";
  return {
    title,
    description,
    alternates: { canonical: `/duality/${date}` },
    openGraph: { title, description, url: `/duality/${date}` },
  };
}

export default async function DualityPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  const day = await getDualityContent(date);
  return <DualityGame day={day} date={date} />;
}
