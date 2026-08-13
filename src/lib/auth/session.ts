import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret) return new TextEncoder().encode(secret);

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET must be set in production.");
  }

  console.warn(
    "[auth] AUTH_SESSION_SECRET is not set — using an insecure dev-only secret. " +
      "Sessions will not survive a server restart. Set AUTH_SESSION_SECRET before deploying."
  );
  return new TextEncoder().encode("dev-only-insecure-session-secret");
}

type SessionPayload = {
  sub: string; // userId
  sv: number; // sessionVersion at time of issue
};

export async function createSession(userId: string, sessionVersion: number) {
  const token = await new SignJWT({ sub: userId, sv: sessionVersion } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Verifies the session cookie's signature/expiry, then checks the embedded
 * sessionVersion against the DB so logout-everywhere and password changes
 * invalidate existing cookies immediately rather than waiting for expiry.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let payload: SessionPayload;
  try {
    const result = await jwtVerify(token, getSecretKey());
    payload = result.payload as unknown as SessionPayload;
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.sessionVersion !== payload.sv) return null;

  return user;
}
