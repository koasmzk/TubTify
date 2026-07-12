// app/api/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resolveStreamUrl } from "@/lib/ytdlp";

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("id");

  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  try {
    // resolve dapet direct googlevideo url dari yt-dlp
    const info = await resolveStreamUrl(videoId);
    const streamUrl = info.url;

    // ambil Range header dari client (browser <audio> suka request partial content)
    const range = req.headers.get("range") ?? undefined;

    // proxy fetch ke googlevideo url, biar client gak langsung hit url asli
    // (url asli punya expiry + signature yang terikat ke IP/session resolver)
    const upstream = await fetch(streamUrl, {
      headers: range ? { Range: range } : {},
    });

    if (!upstream.body) {
      return NextResponse.json({ error: "No stream body" }, { status: 502 });
    }

    // forward header penting biar seek/scrub di player jalan normal
    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") ?? "audio/webm");
    if (upstream.headers.get("content-length")) {
      headers.set("Content-Length", upstream.headers.get("content-length")!);
    }
    if (upstream.headers.get("content-range")) {
      headers.set("Content-Range", upstream.headers.get("content-range")!);
      headers.set("Accept-Ranges", "bytes");
    }

    return new NextResponse(upstream.body, {
      status: upstream.status, // 200 atau 206 (partial content) ngikut upstream
      headers,
    });
  } catch (err) {
    console.error("Stream resolve error:", err);
    return NextResponse.json({ error: "Failed to resolve stream" }, { status: 500 });
  }
}