import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhoHadMore",
    short_name: "WhoHadMore",
    description:
      "A free set of 4 quick daily puzzles: Chain, Duality, Word, and Mini.",
    // "/" - the card, all four games. This was "/play", which only ever
    // redirects here, so every launch of an installed app paid for a redirect
    // to arrive at the same place.
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
