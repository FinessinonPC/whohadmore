import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "WhoHadMore - a daily higher/lower game";
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
        {/* Mark - green ▲ (higher) over red ▼ (lower) */}
        <svg width="200" height="230" viewBox="0 0 200 230">
          <polygon points="100,0 0,102 200,102" fill="#00C853" />
          <polygon points="0,128 200,128 100,230" fill="#FF3B30" />
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
          WhoHadMore
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
          DAILY HIGHER-OR-LOWER
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
