import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhoHadMore",
    short_name: "WhoHadMore",
    description:
      "A daily higher/lower game. Two cards, one stat — tap the bigger number.",
    start_url: "/play",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
