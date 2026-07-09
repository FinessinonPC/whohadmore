import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "WhoHadMore - 4 quick daily puzzles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded share card. Drawn with primitives + Inter (Black wordmark, Bold
// label) so it reads as a real brand, not a default-font template. Fonts are
// read from disk at build time; the route prerenders to a static PNG.
export default function OpengraphImage() {
  const black = readFileSync(join(process.cwd(), "app/Inter-Black.ttf"));
  const bold = readFileSync(join(process.cwd(), "app/Inter-Bold.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #1b1d23 0%, #0A0A0B 62%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter",
        }}
      >
        {/* Mark - Abstract W */}
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M 10 16 L 24 50 L 36 26" fill="none" stroke="#00C853" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 28 26 L 40 50 L 54 16" fill="none" stroke="#FF3B30" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div
          style={{
            marginTop: 46,
            fontSize: 108,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            color: "#FFFFFF",
          }}
        >
          WHOHADMORE
        </div>

        {/* Pill label */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            padding: "15px 34px",
            borderRadius: 999,
            background: "rgba(0,200,83,0.12)",
            border: "2px solid rgba(0,200,83,0.5)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#00C853",
          }}
        >
          4 DAILY PUZZLES
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: black, weight: 900, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
