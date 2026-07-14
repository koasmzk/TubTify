// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { create } from "yt-dlp-exec";
import path from "path";

const YTDLP_BINARY = path.join(process.cwd(), "bin", "yt-dlp.exe");
const ytdlp = create(YTDLP_BINARY);

const COMPILATION_KEYWORDS = [
  "mix", "compilation", "nonstop", "playlist", "top hits", "best songs",
  "full album", "1 hour", "trending 20", "tiktok viral", "tanpa iklan",
];

const MAX_DURATION_SECONDS = 8 * 60; 

function looksLikeCompilation(title: string, duration: number | undefined): boolean {
  const lowerTitle = title.toLowerCase();
  const hasKeyword = COMPILATION_KEYWORDS.some((kw) => lowerTitle.includes(kw));
  const tooLong = typeof duration === "number" && duration > MAX_DURATION_SECONDS;
  return hasKeyword || tooLong;
}

interface YtDlpEntry {
  id: string;
  title?: string;
  channel?: string;
  uploader?: string;
  duration?: number;
  thumbnails?: { url: string }[];
}

interface YtDlpSearchResult {
  entries?: YtDlpEntry[];
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 20; 

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const result = (await ytdlp(`ytsearch50:${query}`, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noCheckCertificate: true,
      noWarnings: true,
    })) as unknown as YtDlpSearchResult;

    const tracks = (result.entries ?? [])
      .filter((entry) => !looksLikeCompilation(entry.title ?? "", entry.duration))
      .filter(
        (entry, index, arr) => arr.findIndex((e) => e.id === entry.id) === index
      )
      .slice(0, limit) 
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        artist: entry.channel ?? entry.uploader ?? "Unknown",
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