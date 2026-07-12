// app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // proxy image lewat server kita, biar canvas client-side bisa baca pixel-nya
  // (i.ytimg.com gak kirim CORS header, jadi kalau diakses langsung, canvas "tainted")
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg" },
  });
}