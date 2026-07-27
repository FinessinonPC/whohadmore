import { OG_SIZE, titleCard } from "@/lib/shareCard";

export const alt = "Questions about WhoHadMore";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function FaqOgImage() {
  return titleCard("FAQ", "How WhoHadMore's daily games, scoring and streaks work");
}
