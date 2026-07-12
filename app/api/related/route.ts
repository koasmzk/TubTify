import { NextRequest, NextResponse } from "next/server";
import { create } from "yt-dlp-exec";
import path from "path";

const YTDLP_BINARY = path.join(process.cwd(), "bin", "yt-dlp.exe");
const ytdlp = create(YTDLP_BINARY);

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("id");
  const artist = req.nextUrl.searchParams.get("artist");

  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  try {
    // RD<videoId> adalah playlist "Mix" otomatis YouTube berdasarkan video ini
    // -> hasilnya genre/vibe-consistent tanpa perlu logic tambahan di sisi kita
    const mixUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;

    const result = await ytdlp(mixUrl, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noCheckCertificate: true,
      noWarnings: true,
      playlistEnd: 15,
    });

    const tracks = (result.entries ?? [])
      .filter((entry: any) => entry.id && entry.id !== videoId)
      .slice(0, 10)
      .map((entry: any) => ({
        id: entry.id,
        title: entry.title,
        artist: entry.channel ?? entry.uploader ?? "Unknown",
        cover:
          entry.thumbnails?.[entry.thumbnails.length - 1]?.url ??
          `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
        duration: entry.duration,
      }));

    if (tracks.length > 0) {
      return NextResponse.json({ tracks });
    }

    // Mix kosong -> lempar biar masuk fallback di bawah
    throw new Error("Empty mix result");
  } catch (err) {
    console.error("Related (mix) fetch error:", err);

    // Fallback: search biasa pakai nama artist
    if (artist) {
      try {
        const fallback = await ytdlp(`ytsearch10:${artist}`, {
          dumpSingleJson: true,
          flatPlaylist: true,
          noCheckCertificate: true,
          noWarnings: true,
        });

        const tracks = (fallback.entries ?? [])
          .filter((entry: any) => entry.id && entry.id !== videoId)
          .map((entry: any) => ({
            id: entry.id,
            title: entry.title,
            artist: entry.channel ?? entry.uploader ?? "Unknown",
            cover:
              entry.thumbnails?.[entry.thumbnails.length - 1]?.url ??
              `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
            duration: entry.duration,
          }));

        return NextResponse.json({ tracks });
      } catch (fallbackErr) {
        console.error("Fallback search error:", fallbackErr);
      }
    }

    return NextResponse.json({ tracks: [] });
  }
}