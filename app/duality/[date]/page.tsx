import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DualityGame } from "@/components/games/DualityGame";
import { getDualityContent } from "@/lib/minigames";
import { gameSeo } from "@/lib/gameSeo";
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
  // Copy comes from gameSeo so there is one description of Duality, not two.
  // The pair that used to live here - "two worlds, eight things, sort every one
  // to its side" - described a sorting game, which Duality has not been for a
  // while. It was still what Google showed for "whohadmore duality".
  const title = "Duality";
  const description = gameSeo("duality")?.metaDescription ?? "";
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
  await requireDateAccess(date);
  const day = await getDualityContent(date);
  return <DualityGame day={day} date={date} />;
}
