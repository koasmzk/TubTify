// app/api/playlists/[id]/tracks/route.ts
import { prisma, getUserId } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  const { id } = await params;
  const b = (await req.json()) as {
    videoId?: string;
    title?: string;
    artist?: string;
    cover?: string | null;
    duration?: number;
  };

  if (!b.videoId || !b.title) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  // Pastiin playlist ini milik user
  const playlist = await prisma.playlist.findFirst({ where: { id, userId } });
  if (!playlist) return Response.json({ error: "not found" }, { status: 404 });

  // Lagu yang sama nggak boleh dobel (primary key playlistId+videoId)
  const exist = await prisma.playlistTrack.findUnique({
    where: { playlistId_videoId: { playlistId: id, videoId: b.videoId } },
  });
  if (exist) return Response.json({ added: false, reason: "exists" });

  // position = terakhir + 1 (lagu baru masuk paling bawah)
  const last = await prisma.playlistTrack.aggregate({
    where: { playlistId: id },
    _max: { position: true },
  });

  await prisma.playlistTrack.create({
    data: {
      playlistId: id,
      videoId: b.videoId,
      title: b.title,
      artist: b.artist ?? "",
      cover: b.cover ?? null,
      duration: Math.round(b.duration ?? 0),
      position: (last._max.position ?? -1) + 1,
    },
  });
  return Response.json({ added: true }, { status: 201 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  const { id } = await params;
  const videoId = new URL(req.url).searchParams.get("videoId");
  if (!videoId) return Response.json({ error: "videoId required" }, { status: 400 });

  const playlist = await prisma.playlist.findFirst({ where: { id, userId } });
  if (!playlist) return Response.json({ error: "not found" }, { status: 404 });

  await prisma.playlistTrack.deleteMany({ where: { playlistId: id, videoId } });
  return Response.json({ ok: true });
}