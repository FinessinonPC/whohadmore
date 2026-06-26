import { ImageResponse } from "next/og";

export const alt = "WhoHadMore — a daily higher/lower game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded share card, drawn entirely with primitives (no asset files):
// a green triangle up over a red triangle down — the higher/lower motif.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #17181D 0%, #0A0A0B 65%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo mark — green ▲ (higher) over red ▼ (lower) */}
        <svg width="210" height="300" viewBox="0 0 210 300">
          <polygon points="105,0 0,135 210,135" fill="#00C853" />
          <polygon points="0,165 210,165 105,300" fill="#FF3B30" />
        </svg>

        <div
          style={{
            marginTop: 60,
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#FFFFFF",
          }}
        >
          WhoHadMore
        </div>
        <div style={{ marginTop: 16, fontSize: 40, fontWeight: 600, color: "#9AA0A6" }}>
          A daily higher / lower game
        </div>
      </div>
    ),
    { ...size }
  );
}
