// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { create } from "yt-dlp-exec";
import path from "path";

const YTDLP_BINARY = path.join(process.cwd(), "bin", "yt-dlp.exe");
const ytdlp = create(YTDLP_BINARY);

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    // ytsearch20: ambil 20 hasil teratas, flatPlaylist biar gak resolve full info tiap video (lebih cepat)
    const result = await ytdlp(`ytsearch20:${query}`, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noCheckCertificate: true,
      noWarnings: true,
    });

    // mapping ke shape yang gampang dipake UI
    const tracks = (result.entries ?? []).map((entry: any) => ({
      id: entry.id,
      title: entry.title,
      artist: entry.channel ?? entry.uploader ?? "Unknown",
      // thumbnail dari flatPlaylist kadang null, fallback ke pola URL standar YouTube
      cover: entry.thumbnails?.[entry.thumbnails.length - 1]?.url
        ?? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
      duration: entry.duration,
    }));

    return NextResponse.json({ tracks });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}