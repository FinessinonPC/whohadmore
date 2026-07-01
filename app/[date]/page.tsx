import { notFound, permanentRedirect } from "next/navigation";
import { isValidISODate } from "@/lib/date";

// Convenience alias: whohadmore.com/YYYY-MM-DD -> /play/YYYY-MM-DD (the canonical
// puzzle page with its share card). Static routes (/about, /archive, /leaderboard,
// /profile, /play, ...) take priority, so only date-shaped paths land here.
export default async function DateAlias({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();
  permanentRedirect(`/play/${date}`);
}
