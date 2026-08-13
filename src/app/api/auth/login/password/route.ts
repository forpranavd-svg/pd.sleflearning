import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/validation";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.identifier !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Enter your email/phone and password." }, { status: 400 });
  }
  const identifier = body.identifier.trim();
  const password = body.password;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await checkRateLimit("password-login", `${ip}:${identifier}`, 10, "15 m");
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const normalizedEmail = identifier.includes("@") ? normalizeEmail(identifier) : null;
  const user = await prisma.user.findFirst({
    where: normalizedEmail ? { email: normalizedEmail } : { phone: identifier },
  });

  const isValid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !isValid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  await createSession(user.id, user.sessionVersion);
  return NextResponse.json({ ok: true });
}
