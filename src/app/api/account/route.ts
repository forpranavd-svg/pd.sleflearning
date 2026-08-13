import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, clearSession } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  return NextResponse.json({
    profile: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
}

// Deletes the account. Practice attempts (the user's own typed answers) are
// deleted outright. Questions the user owns are NOT deleted — other users
// may have added them to their own list (#15) — instead they become
// system-owned (ownerId set to null) via the FK's ON DELETE SET NULL,
// same as UserQuestion/Job rows CASCADE-deleting automatically.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  await prisma.$transaction([
    prisma.practiceAttempt.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  await clearSession();
  return NextResponse.json({ ok: true });
}
