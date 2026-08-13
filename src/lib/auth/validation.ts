const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164: + followed by 8-15 digits
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Validates a post-login redirect target: must be a same-origin relative
 * path (starts with a single "/", not "//" or "/\") — rejects anything that
 * could be used as an open redirect to an external site.
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
