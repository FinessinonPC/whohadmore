import { OG_SIZE, titleCard } from "@/lib/shareCard";

export const alt = "About WhoHadMore";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AboutOgImage() {
  return titleCard("About", "Four small games. One daily score. New every midnight.");
}
