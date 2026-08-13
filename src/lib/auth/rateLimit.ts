import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

let warned = false;
function warnOnce() {
  if (warned) return;
  warned = true;
  console.warn(
    "[auth] UPSTASH_REDIS_REST_URL/TOKEN are not set — rate limiting is disabled. " +
      "Configure Upstash before handling real traffic."
  );
}

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

// Cache one limiter per (name, requests, window) so repeated calls share a bucket.
const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, requests: number, window: Window) {
  const key = `${name}:${requests}:${window}`;
  let limiter = limiters.get(key);
  if (!limiter && redis) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${name}`,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

/**
 * Sliding-window rate limit shared across serverless instances via Upstash
 * Redis. Fails open (always allows, with a one-time console warning) when
 * Upstash isn't configured, so local dev works without an account.
 */
export async function checkRateLimit(
  name: string,
  identifier: string,
  requests: number,
  window: Window
): Promise<{ success: boolean; remaining: number }> {
  const limiter = getLimiter(name, requests, window);
  if (!limiter) {
    warnOnce();
    return { success: true, remaining: requests };
  }
  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}
