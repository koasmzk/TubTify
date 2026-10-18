// app/api/playlists/[id]/route.ts
import { prisma, getUserId } from "@/lib/db";

// Next.js 15: params itu Promise, wajib di-await.
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  const { id } = await params;

  // where userId -> user lain nggak bisa ngintip playlist orang
  const playlist = await prisma.playlist.findFirst({
    where: { id, userId },
    include: { tracks: { orderBy: { position: "asc" } } },
  });
  if (!playlist) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(playlist);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  const { id } = await params;
  const { name } = (await req.json()) as { name?: string };

  const clean = name?.trim();
  if (!clean) return Response.json({ error: "Nama kosong" }, { status: 400 });

  const res = await prisma.playlist.updateMany({
    where: { id, userId },
    data: { name: clean.slice(0, 100) },
  });
  if (res.count === 0) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  const { id } = await params;

  const res = await prisma.playlist.deleteMany({ where: { id, userId } });
  if (res.count === 0) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}