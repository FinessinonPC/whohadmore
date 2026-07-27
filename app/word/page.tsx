import { redirect } from "next/navigation";
import { todayISO } from "@/lib/date";

// Bare /word -> today's puzzle. These are URLs people type and share (and the
// "Play now" links point here), so they must resolve instead of 404ing.
export default function WordPage() {
  redirect(`/word/${todayISO()}`);
}
