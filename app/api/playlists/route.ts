// app/api/playlists/route.ts
import { prisma, getUserId } from "@/lib/db";

export async function GET() {
  const userId = await getUserId();
  const playlists = await prisma.playlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tracks: true } },
      tracks: { orderBy: { position: "asc" }, take: 1, select: { cover: true } },
    },
  });

  return Response.json(
    playlists.map((p) => ({
      id: p.id,
      name: p.name,
      trackCount: p._count.tracks,
      cover: p.tracks[0]?.cover ?? null,
    }))
  );
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const { name } = (await req.json()) as { name?: string };

  const clean = name?.trim();
  if (!clean) return Response.json({ error: "Nama playlist kosong" }, { status: 400 });

  const playlist = await prisma.playlist.create({
    data: { userId, name: clean.slice(0, 100) },
  });
  return Response.json(
    { id: playlist.id, name: playlist.name, trackCount: 0, cover: null },
    { status: 201 }
  );
}