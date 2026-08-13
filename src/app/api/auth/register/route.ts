import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { isValidEmail, isValidPhone, normalizeEmail } from "@/lib/auth/validation";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { createLoginToken } from "@/lib/auth/tokens";
import { sendMagicLinkEmail } from "@/lib/auth/email";
import { sendOtp } from "@/lib/auth/sms";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await checkRateLimit("register", ip, 10, "1 h");
  if (!success) {
    return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const name = body.name.trim();
  const email = typeof body.email === "string" && body.email.trim() ? normalizeEmail(body.email) : null;
  const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
  const password = typeof body.password === "string" && body.password ? body.password : null;

  if (!email && !phone) {
    return NextResponse.json({ error: "Provide an email or phone number." }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (phone && !isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Enter a valid phone number in international format, e.g. +14155551234." },
      { status: 400 }
    );
  }
  if (password && password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(Boolean) as object[] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email or phone already exists. Try logging in instead." },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: password ? await hashPassword(password) : null,
    },
  });

  // Registration does not itself issue a session — the account is unverified
  // until the user proves control of the email/phone they gave us, same as
  // any later login. Kick off that step immediately so signup reads as one
  // flow: register -> check email/phone -> logged in.
  if (email) {
    const token = await createLoginToken(user.id);
    const verifyUrl = new URL(`/api/auth/login/verify?token=${token}`, request.nextUrl.origin).toString();
    await sendMagicLinkEmail(email, verifyUrl);
    return NextResponse.json({ channel: "email", contact: email });
  }

  await sendOtp(phone!);
  return NextResponse.json({ channel: "phone", contact: phone });
}
