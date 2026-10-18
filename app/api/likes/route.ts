// app/api/likes/route.ts
import { prisma, getUserId } from "@/lib/db";

type TrackBody = {
  videoId: string;
  title: string;
  artist: string;
  cover?: string | null;
  duration?: number;
};

export async function GET() {
  const userId = await getUserId();
  const likes = await prisma.like.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
  });
  return Response.json(likes);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const body = (await req.json()) as Partial<TrackBody>;

  if (!body.videoId || !body.title) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

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
      duration: Math.round(body.duration ?? 0),
    },
  });
  return Response.json({ liked: true });
}