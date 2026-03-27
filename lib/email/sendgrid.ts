import sgMail from "@sendgrid/mail";

function getFrom(): string {
  const from = process.env.SENDGRID_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error("SENDGRID_FROM_EMAIL is not set");
  }
  return from;
}

function ensureClient(): void {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) {
    throw new Error("SENDGRID_API_KEY is not set");
  }
  sgMail.setApiKey(key);
}

export function isSendGridConfigured(): boolean {
  return Boolean(
    process.env.SENDGRID_API_KEY?.trim() && process.env.SENDGRID_FROM_EMAIL?.trim(),
  );
}

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Low-level transactional send. Use typed helpers when possible.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  ensureClient();
  await sgMail.send({
    to: input.to,
    from: getFrom(),
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<pre style="font-family:sans-serif">${escapeHtml(input.text)}</pre>`,
  });
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const OTP_EXPIRES_MIN = 15;

export async function sendVerificationOtpEmail(input: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const subject = `Your ${process.env.NEXT_PUBLIC_APP_NAME ?? "Lucy Merchant"} verification code`;
  const text = [
    `Hi ${input.name},`,
    "",
    `Your verification code is: ${input.code}`,
    "",
    `This code expires in ${OTP_EXPIRES_MIN} minutes.`,
    "",
    `You can also verify here: ${appUrl}/verify-email`,
    "",
    "If you did not create an account, you can ignore this email.",
  ].join("\n");

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.5">
    <p>Hi ${escapeHtml(input.name)},</p>
    <p>Your verification code is:</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:0.2em">${escapeHtml(input.code)}</p>
    <p style="color:#666">This code expires in ${OTP_EXPIRES_MIN} minutes.</p>
    <p><a href="${escapeHtml(appUrl + "/verify-email")}">Open verification page</a></p>
    <p style="color:#666;font-size:14px">If you did not create an account, you can ignore this email.</p>
  </div>`;

  await sendEmail({ to: input.to, subject, text, html });
}

/**
 * Generic notification (order updates, alerts, etc.).
 */
export async function sendNotificationEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  await sendEmail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

const PASSWORD_RESET_EXPIRES_HOURS = 1;

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const subject = `${process.env.NEXT_PUBLIC_APP_NAME ?? "Lucy Merchant"} — reset your password`;
  const text = [
    `Hi ${input.name},`,
    "",
    "We received a request to reset your password. Open the link below (valid for " +
      PASSWORD_RESET_EXPIRES_HOURS +
      " hour):",
    "",
    input.resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.5">
  <p>Hi ${escapeHtml(input.name)},</p>
  <p>We received a request to reset your password. This link expires in ${PASSWORD_RESET_EXPIRES_HOURS} hour.</p>
  <p><a href="${escapeHtml(input.resetUrl)}">Reset password</a></p>
  <p style="color:#666;font-size:14px">If you did not request this, you can ignore this email.</p>
</div>`;

  await sendEmail({ to: input.to, subject, text, html });
}

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  role: "merchant" | "supplier";
}): Promise<void> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const dash =
    input.role === "supplier" ? "/supplier/dashboard" : "/merchant/dashboard";
  const label = process.env.NEXT_PUBLIC_APP_NAME ?? "Lucy Merchant";
  const subject = `Welcome to ${label}`;
  const text = [
    `Hi ${input.name},`,
    "",
    "Your email is verified. You can sign in anytime.",
    "",
    `Open your workspace: ${appUrl}${dash}`,
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.5">
  <p>Hi ${escapeHtml(input.name)},</p>
  <p>Your email is verified. You&apos;re all set.</p>
  <p><a href="${escapeHtml(appUrl + dash)}">Go to your dashboard</a></p>
</div>`;
  await sendEmail({ to: input.to, subject, text, html });
}
