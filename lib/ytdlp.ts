// lib/ytdlp.ts
import { create } from "yt-dlp-exec";
import path from "path";

const YTDLP_BINARY = path.join(process.cwd(), "bin", "yt-dlp.exe");
const ytdlp = create(YTDLP_BINARY);

export async function resolveStreamUrl(videoId: string) {
  // PO Token sekarang otomatis di-handle plugin bgutil-ytdlp-pot-provider
  // yang connect ke server lokal port 4416 — gak perlu extractorArgs manual
  const info = await ytdlp(`https://www.youtube.com/watch?v=${videoId}`, {
    dumpSingleJson: true,
    format: "bestaudio",
    noCheckCertificate: true, 
    noWarnings: true,
  });

  return info;
}