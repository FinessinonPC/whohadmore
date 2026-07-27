import { OG_SIZE, titleCard } from "@/lib/shareCard";

export const alt = "The four free daily games on WhoHadMore";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function GamesOgImage() {
  return titleCard("Four games", "Chain · Duality · Word · Mini — free every day");
}
