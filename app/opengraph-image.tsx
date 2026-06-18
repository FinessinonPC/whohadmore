import { ImageResponse } from "next/og";

export const alt = "WhoHadMore — a daily higher/lower game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded share card, drawn entirely with primitives (no asset files).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo mark — up/down chevrons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 260,
            height: 260,
            background: "#111111",
            borderRadius: 56,
          }}
        >
          <svg width="170" height="170" viewBox="0 0 64 64">
            <path d="M18 29 L32 16 L46 29" fill="none" stroke="#00C853" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 35 L32 48 L46 35" fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div
          style={{
            marginTop: 56,
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#111111",
          }}
        >
          WhoHadMore
        </div>
        <div style={{ marginTop: 12, fontSize: 34, color: "#888888" }}>
          Two cards. One stat. Tap the bigger number.
        </div>
      </div>
    ),
    { ...size }
  );
}
