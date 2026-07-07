import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuadsGame } from "@/components/games/QuadsGame";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const title = "Quads";
  const description =
    "Sixteen words hide four groups of four. Find the connections in today's free daily puzzle on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: `/quads/${date}` },
    openGraph: { title, description, url: `/quads/${date}` },
  };
}

export default async function QuadsPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  return <QuadsGame date={date} />;
}
