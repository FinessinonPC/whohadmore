import { NextResponse } from "next/server";
import { searchWikimediaImages } from "@/lib/wikimedia";

// Proxy: GET /api/wikimedia/search?query=...  ->  { results: [{ title, imageUrl }] }
export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get("query");
  if (!query || !query.trim()) {
    return NextResponse.json({ results: [] });
  }
  const results = await searchWikimediaImages(query);
  return NextResponse.json({ results });
}
