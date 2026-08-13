import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createLoginToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  await prisma.loginToken.create({
    data: {
      tokenHash: hashToken(rawToken),
      userId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return rawToken;
}

/**
 * Atomically claims a login token (single-use, race-safe via the
 * consumedAt: null guard in the WHERE clause) and returns the associated
 * userId, or null if the token is missing/expired/already used.
 */
export async function consumeLoginToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const result = await prisma.loginToken.updateMany({
    where: { tokenHash, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });
  if (result.count === 0) return null;

  const token = await prisma.loginToken.findUnique({ where: { tokenHash } });
  return token?.userId ?? null;
}
