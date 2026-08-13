import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPhone } from "@/lib/auth/validation";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { sendOtp } from "@/lib/auth/sms";

const GENERIC_RESPONSE = { message: "If an account exists for that phone number, we sent a code." };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.phone !== "string" || !isValidPhone(body.phone)) {
    return NextResponse.json(
      { error: "Enter a valid phone number in international format, e.g. +14155551234." },
      { status: 400 }
    );
  }
  const phone = body.phone.trim();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const [ipLimit, phoneLimit] = await Promise.all([
    checkRateLimit("otp-request-ip", ip, 20, "1 h"),
    checkRateLimit("otp-request-phone", phone, 5, "1 h"),
  ]);
  if (!ipLimit.success || !phoneLimit.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  // Same non-committal response whether or not the account exists — and we
  // only actually call the (paid, per-message) SMS provider when it does.
  const user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    await sendOtp(phone);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
