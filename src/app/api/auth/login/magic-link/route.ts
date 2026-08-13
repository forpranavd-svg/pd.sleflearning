import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { createLoginToken } from "@/lib/auth/tokens";
import { sendMagicLinkEmail } from "@/lib/auth/email";

const GENERIC_RESPONSE = { message: "If an account exists for that email, we sent a login link." };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || !isValidEmail(body.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const email = normalizeEmail(body.email);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit("magic-link-ip", ip, 20, "1 h"),
    checkRateLimit("magic-link-email", email, 5, "1 h"),
  ]);
  if (!ipLimit.success || !emailLimit.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  // Always respond identically whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await createLoginToken(user.id);
    const verifyUrl = new URL(`/api/auth/login/verify?token=${token}`, request.nextUrl.origin).toString();
    await sendMagicLinkEmail(email, verifyUrl);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
