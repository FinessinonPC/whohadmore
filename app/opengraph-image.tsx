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
        {/* Logo mark — two cards, the bigger one "had more" */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 24,
            width: 260,
            height: 260,
            background: "#111111",
            borderRadius: 56,
            paddingBottom: 58,
            boxSizing: "border-box",
          }}
        >
          <div style={{ width: 58, height: 96, borderRadius: 12, background: "rgba(255,255,255,0.5)" }} />
          <div style={{ width: 58, height: 140, borderRadius: 12, background: "#00C853" }} />
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
