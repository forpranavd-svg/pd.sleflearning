import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

function isTwilioConfigured() {
  return !!(accountSid && authToken && verifyServiceSid);
}

// Dev-only fallback so the OTP flow is testable without a Twilio account.
// In-memory, so it only works within a single long-running process (e.g.
// `next dev`) — not meaningful across serverless invocations.
const devOtpStore = new Map<string, { code: string; expiresAt: number }>();

export async function sendOtp(phone: string) {
  if (!isTwilioConfigured()) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    devOtpStore.set(phone, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.warn(`[auth] Twilio is not configured — dev mode: OTP for ${phone} is ${code}`);
    return;
  }

  const client = twilio(accountSid, authToken);
  await client.verify.v2.services(verifyServiceSid!).verifications.create({ to: phone, channel: "sms" });
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  if (!isTwilioConfigured()) {
    const entry = devOtpStore.get(phone);
    if (!entry || entry.expiresAt < Date.now() || entry.code !== code) return false;
    devOtpStore.delete(phone);
    return true;
  }

  const client = twilio(accountSid, authToken);
  const check = await client.verify.v2
    .services(verifyServiceSid!)
    .verificationChecks.create({ to: phone, code });
  return check.status === "approved";
}
