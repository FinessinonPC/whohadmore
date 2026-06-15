import { NextResponse } from "next/server";
import { getFullGame } from "@/lib/games";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  if (!isValidISODate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const game = await getFullGame(date);
  return NextResponse.json({ game });
}
