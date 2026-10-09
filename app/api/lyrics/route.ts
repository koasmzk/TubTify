// app/api/lyrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enrichTrack } from "@/lib/musixmatch";
import { getLrclibLyrics } from "@/lib/lrclib";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "";
  const artist = req.nextUrl.searchParams.get("artist") ?? "";
  const result: Record<string, any> = (await enrichTrack(title, artist)) ?? {};

  if (!result.syncedLyrics?.length) {
    try {
      const lrc = await getLrclibLyrics(title, artist);
      if (lrc?.syncedLyrics) result.syncedLyrics = lrc.syncedLyrics; 
      if (!result.lyrics && lrc?.lyrics) result.lyrics = lrc.lyrics; 
    } catch {
    }
  }
  return NextResponse.json(result);
}