import { NextResponse } from "next/server";
import { getWikimediaThumbnail } from "@/lib/wikimedia";

// Proxy so the browser never calls Wikipedia directly (CORS + rate limits).
// GET /api/wikimedia?query=LeBron%20James  ->  { imageUrl: string | null }
export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get("query");
  if (!query || !query.trim()) {
    return NextResponse.json({ imageUrl: null });
  }

  const imageUrl = await getWikimediaThumbnail(query);
  return NextResponse.json({ imageUrl });
}
