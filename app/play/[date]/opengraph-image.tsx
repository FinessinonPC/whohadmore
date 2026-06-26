import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getGameMeta } from "@/lib/games";
import { isValidISODate } from "@/lib/date";

export const alt = "WhoHadMore - a daily higher/lower puzzle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-puzzle share card (Design A: clean "Who had more <stat>?" question hero).
// Rendered on demand for each /play/<date>; falls back gracefully if the day
// has no published game.
export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const meta = isValidISODate(date) ? await getGameMeta(date) : null;
  const topic = meta?.topic_label?.trim() || "Daily Puzzle";
  const stat = (meta?.stat_label ?? "").trim().toLowerCase();
  const question = stat ? `Who had more ${stat}?` : "Who had more?";

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
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #1b1d23 0%, #0A0A0B 62%)",
          fontFamily: "Inter",
          padding: "62px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="40" height="46" viewBox="0 0 40 46">
              <polygon points="20,0 0,20 40,20" fill="#00C853" />
              <polygon points="0,26 40,26 20,46" fill="#FF3B30" />
            </svg>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "#FFFFFF" }}>
              WhoHadMore
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.16em", color: "#7B818B" }}>
            DAILY PUZZLE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 33, fontWeight: 700, color: "#9AA0A6" }}>{topic}</div>
          <div
            style={{
              fontSize: 74,
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: "#FFFFFF",
              marginTop: 12,
            }}
          >
            {question}
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              padding: "13px 28px",
              borderRadius: 999,
              background: "rgba(0,200,83,0.14)",
              border: "2px solid rgba(0,200,83,0.5)",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#00C853",
            }}
          >
            Tap whichever had more
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
