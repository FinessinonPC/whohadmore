import { ImageResponse } from "next/og";

export const alt = "WhoHadMore — a daily higher/lower game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded share card, drawn entirely with primitives (no asset files).
export default function OpengraphImage() {
  const bars = [
    { h: 150, c: "rgba(255,255,255,0.85)" },
    { h: 230, c: "rgba(255,255,255,0.5)" },
    { h: 320, c: "#00C853" },
  ];

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
        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 18,
            width: 260,
            height: 260,
            background: "#111111",
            borderRadius: 56,
            padding: 44,
            boxSizing: "border-box",
          }}
        >
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: b.h,
                background: b.c,
                borderRadius: 14,
              }}
            />
          ))}
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
