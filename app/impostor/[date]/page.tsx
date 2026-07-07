import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImpostorGame } from "@/components/games/ImpostorGame";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  if (!isValidISODate(date)) return {};
  const title = "Impostor";
  const description =
    "Four things - three share a secret connection, one is lying. Spot the impostor in this quick daily game on WhoHadMore.";
  return {
    title,
    description,
    alternates: { canonical: `/impostor/${date}` },
    openGraph: { title, description, url: `/impostor/${date}` },
  };
}

export default async function ImpostorPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  return <ImpostorGame date={date} />;
}
