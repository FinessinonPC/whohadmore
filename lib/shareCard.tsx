import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// ============================================================================
// The link-preview card ("Card B"): a huge puzzle number on a dark ground with
// a faint diagonal wash of the four game colors. One design, used by both the
// homepage OG image (today's number) and the per-date one - the number is the
// hook people compare notes on, Wordle-style.
// ============================================================================

export const OG_SIZE = { width: 1200, height: 630 };

export function puzzleNumberCard(gameNumber: number | null, subline: string): ImageResponse {
  const black = readFileSync(join(process.cwd(), "app/Inter-Black.ttf"));
  const bold = readFileSync(join(process.cwd(), "app/Inter-Bold.ttf"));

  const hero = gameNumber && gameNumber > 0 ? `No. ${gameNumber}` : "Every day";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0D10",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* Faint diagonal wash of the four game colors */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.14,
            background:
              "repeating-linear-gradient(115deg, #00C853 0px, #00C853 80px, #06B6D4 80px, #06B6D4 160px, #FFC400 160px, #FFC400 240px, #2E6BFF 240px, #2E6BFF 320px)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* The Crown Chip - the brand mark */}
          <svg width="88" height="88" viewBox="0 0 100 100" style={{ marginBottom: 22 }}>
            <g transform="rotate(-6 50 50)">
              <rect x="18" y="22" width="68" height="68" rx="15" fill="#000000" opacity="0.45" />
              <rect x="14" y="18" width="68" height="68" rx="15" fill="#F6F1E3" stroke="#16181D" strokeWidth="6.5" />
              <path
                d="M 28 66 L 25 38 L 39 49 L 48 33 L 57 49 L 71 38 L 68 66 Z"
                fill="#FFB300"
                stroke="#16181D"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
            </g>
          </svg>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#9AA098",
            }}
          >
            WHOHADMORE · DAILY PUZZLE
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 190,
              fontWeight: 900,
              lineHeight: 1,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            {hero}
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 32,
              fontWeight: 700,
              color: "#9AA098",
              maxWidth: 900,
            }}
          >
            {subline}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: black, weight: 900, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
