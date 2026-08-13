import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeLoginToken } from "@/lib/auth/tokens";
import { createSession } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/validation";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const next = safeNextPath(request.nextUrl.searchParams.get("next")) ?? "/";

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.nextUrl.origin));
  }

  const userId = await consumeLoginToken(token);
  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.nextUrl.origin));
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.nextUrl.origin));
  }

  await createSession(user.id, user.sessionVersion);
  return NextResponse.redirect(new URL(next, request.nextUrl.origin));
}
