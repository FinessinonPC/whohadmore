import type { Metadata } from "next";
import { RandomDeal } from "@/components/hub/RandomDeal";

export const metadata: Metadata = {
  title: "Play a random puzzle",
  description:
    "Deal yourself a random day from the WhoHadMore archive - Chain, Duality, Word and the Mini from any past card, free with an account.",
  alternates: { canonical: "/random" },
  // A shuffle has nothing stable for Google to index, and every deal would be
  // a different page. The archive is the crawlable version of this.
  robots: { index: false, follow: true },
};

/** Deal a random archived card. Which card depends on what this player has
 *  already finished, so the whole thing resolves client-side. */
export default function RandomPage() {
  return <RandomDeal />;
}
