import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Self Learning <onboarding@resend.dev>";

export async function sendMagicLinkEmail(to: string, verifyUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      `[auth] RESEND_API_KEY is not set — dev mode: magic link for ${to}:\n  ${verifyUrl}`
    );
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Log in to Self Learning",
    html: `
      <p>Click the link below to log in. This link expires in 15 minutes and can only be used once.</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send magic link email: ${error.message}`);
  }
}
