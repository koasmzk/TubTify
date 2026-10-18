// lib/db.ts
// Sama kayak versi JS: `prisma` (koneksi DB) + `getUserId()` (ID user dari cookie).
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

// Singleton biar koneksi nggak numpuk pas hot-reload. Cast tipe supaya TS nggak protes.
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

export async function getUserId(): Promise<string> {
  const jar = await cookies(); // Next.js 15: async
  const existing = jar.get("uid")?.value;

  if (existing) {
    // Pastiin user masih ada di DB (cookie bisa nyangkut walau DB di-reset).
    const found = await prisma.user.findUnique({ where: { id: existing } });
    if (found) return existing;
  }

  const user = await prisma.user.create({ data: {} });
  jar.set("uid", user.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return user.id;
}