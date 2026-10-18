// app/api/likes/route.ts
// GET  -> daftar lagu yang di-like user ini
// POST -> toggle like (belum ada = like, sudah ada = unlike)
import { prisma, getUserId } from "@/lib/db";

// Bentuk data track yang dikirim dari frontend
type TrackBody = {
  videoId: string;
  title: string;
  artist: string;
  cover?: string | null;
};

export async function GET() {
  const userId = await getUserId();
  const likes = await prisma.like.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" }, // terbaru di atas
  });
  return Response.json(likes);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const body = (await req.json()) as Partial<TrackBody>;

  // Validasi minimal sebelum masuk DB
  if (!body.videoId || !body.title) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  // Nama key composite otomatis dari @@id([userId, videoId]) -> userId_videoId
  const key = { userId_videoId: { userId, videoId: body.videoId } };

  const exist = await prisma.like.findUnique({ where: key });
  if (exist) {
    await prisma.like.delete({ where: key });
    return Response.json({ liked: false });
  }

  await prisma.like.create({
    data: {
      userId,
      videoId: body.videoId,
      title: body.title,
      artist: body.artist ?? "",
      cover: body.cover ?? null,
    },
  });
  return Response.json({ liked: true });
}