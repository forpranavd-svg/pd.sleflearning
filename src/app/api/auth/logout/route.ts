import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, clearSession } from "@/lib/auth/session";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    // Bump sessionVersion so the cleared cookie — or any copy of it that
    // leaked — can't be replayed to re-authenticate.
    await prisma.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
