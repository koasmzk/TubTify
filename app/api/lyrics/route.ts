// app/api/lyrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichTrack } from "@/lib/musixmatch";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "";
  const artist = req.nextUrl.searchParams.get("artist") ?? "";

  const result = await enrichTrack(title, artist);
  return NextResponse.json(result);
}