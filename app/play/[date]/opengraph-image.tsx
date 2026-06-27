import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getGameMeta } from "@/lib/games";
import { isValidISODate } from "@/lib/date";

export const alt = "WhoHadMore - a daily higher/lower puzzle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-puzzle share card: the day's topic as the hero on the bold green brand
// background. Rendered on demand for each /play/<date>; falls back to a generic
// title when a day has no published game.
export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const meta = isValidISODate(date) ? await getGameMeta(date) : null;
  const topic = meta?.topic_label?.trim() || "Daily Puzzle";

  const black = readFileSync(join(process.cwd(), "app/Inter-Black.ttf"));
  const bold = readFileSync(join(process.cwd(), "app/Inter-Bold.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#00C853",
          fontFamily: "Inter",
          padding: "60px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 50,
                height: 50,
                borderRadius: 13,
                background: "#0A0A0B",
              }}
            >
              <svg width="26" height="30" viewBox="0 0 40 46">
                <polygon points="20,0 0,20 40,20" fill="#00C853" />
                <polygon points="0,26 40,26 20,46" fill="#FF3B30" />
              </svg>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "#0A0A0B" }}>
              WhoHadMore
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.16em", color: "rgba(10,10,11,0.55)" }}>
            DAILY PUZZLE
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.04, color: "#0A0A0B" }}>
            {topic}
          </div>
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
