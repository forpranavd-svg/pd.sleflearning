import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPhone } from "@/lib/auth/validation";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { verifyOtp } from "@/lib/auth/sms";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.phone !== "string" ||
    !isValidPhone(body.phone) ||
    typeof body.code !== "string" ||
    !body.code.trim()
  ) {
    return NextResponse.json({ error: "Enter the code we sent you." }, { status: 400 });
  }
  const phone = body.phone.trim();
  const code = body.code.trim();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await checkRateLimit("otp-verify", `${ip}:${phone}`, 10, "1 h");
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  const isValid = user ? await verifyOtp(phone, code) : false;
  if (!user || !isValid) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  await createSession(user.id, user.sessionVersion);
  return NextResponse.json({ ok: true });
}
