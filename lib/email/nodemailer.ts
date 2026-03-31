/**
 * Transactional email via Nodemailer (SMTP).
 *
 * Set `NODEMAILER_FROM_EMAIL`, `NODEMAILER_PASSWORD` (e.g. Gmail app password — spaces optional).
 * Optional: `NODEMAILER_USER` (defaults to from-email), `NODEMAILER_FROM_NAME`,
 * `NODEMAILER_HOST` (default `smtp.gmail.com`), `NODEMAILER_PORT` (default `465`; use `587` for STARTTLS).
 *
 * **DNS:** Nodemailer’s internal resolver is bypassed. We resolve IPv4 with `dns.promises.Resolver`, then
 * on failure **DNS-over-HTTPS** (Google / Cloudflare JSON APIs over port 443 — works when UDP/53 is blocked).
 * Optional: `NODEMAILER_SMTP_IP` to skip resolution; set `NODEMAILER_TLS_SERVERNAME` when needed.
 */
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/auth/admin-invite";
import { promises as dnsPromises } from "node:dns";
import { Resolver } from "node:dns/promises";
import net from "node:net";
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let buildInFlight: Promise<Transporter> | null = null;

function stripEnvQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2) {
    const a = t[0];
    const b = t[t.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      return t.slice(1, -1).trim();
    }
  }
  return t;
}

/** Gmail app passwords are often shown with spaces; SMTP expects 16 chars without spaces. */
function normalizeSmtpPassword(raw: string): string {
  return raw.replace(/\s+/g, "");
}

export function getFromEmail(): string {
  const from = stripEnvQuotes(process.env.NODEMAILER_FROM_EMAIL ?? "");
  if (!from) {
    throw new Error("NODEMAILER_FROM_EMAIL is not set");
  }
  return from;
}

function getFromName(): string {
  return (
    stripEnvQuotes(process.env.NODEMAILER_FROM_NAME ?? "") ||
    process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
    "Lucy Merchant"
  );
}

export function isNodemailerConfigured(): boolean {
  const from = stripEnvQuotes(process.env.NODEMAILER_FROM_EMAIL ?? "");
  const pass = normalizeSmtpPassword(
    stripEnvQuotes(process.env.NODEMAILER_PASSWORD ?? ""),
  );
  return Boolean(from && pass);
}

function getSmtpHostname(): string {
  return stripEnvQuotes(process.env.NODEMAILER_HOST ?? "") || "smtp.gmail.com";
}

/**
 * Nameservers for `dns.promises.Resolver` (not the global `dns` module — Nodemailer does not use that).
 * Empty array = Node’s default (system resolver).
 */
function smtpResolverDnsServers(smtpHostname: string): string[] {
  const raw = stripEnvQuotes(process.env.NODEMAILER_DNS_SERVERS ?? "");
  if (raw) return raw.split(/[\s,]+/).filter(Boolean);
  const optOut = stripEnvQuotes(
    process.env.NODEMAILER_DISABLE_PUBLIC_DNS_FALLBACK ?? "",
  ).toLowerCase();
  if (optOut === "1" || optOut === "true" || optOut === "yes") return [];
  if (smtpHostname === "smtp.gmail.com") return ["8.8.8.8", "8.8.4.4"];
  return [];
}

/** Google / Cloudflare DNS JSON — same shape for `type: A` answers. */
type DnsJsonAnswer = { type: number; data: string };
type DnsJsonResponse = { Status: number; Answer?: DnsJsonAnswer[] };

function dohDisabled(): boolean {
  const v = stripEnvQuotes(process.env.NODEMAILER_DISABLE_DOH ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Resolve A record via HTTPS (port 443). Use when UDP DNS to resolvers times out (common on locked-down networks).
 */
async function resolve4ViaDoh(hostname: string): Promise<string | null> {
  if (dohDisabled()) return null;
  const name = encodeURIComponent(hostname);
  const urls = [
    `https://dns.google/resolve?name=${name}&type=A`,
    `https://cloudflare-dns.com/dns-query?name=${name}&type=A`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as DnsJsonResponse;
      if (data.Status !== 0 || !data.Answer?.length) continue;
      const a =
        data.Answer.find((x) => x.type === 1 && net.isIPv4(String(x.data).trim())) ??
        data.Answer.find((x) => x.type === 1);
      const ip = a?.data?.trim().replace(/^"|"$/g, "");
      if (ip && net.isIPv4(ip)) return ip;
    } catch {
      continue;
    }
  }
  return null;
}

async function resolveSmtpIPv4(hostname: string): Promise<string> {
  const servers = smtpResolverDnsServers(hostname);
  const tryUdp = async () => {
    const resolver = new Resolver();
    resolver.setServers(servers.length > 0 ? servers : []);
    const addrs = await resolver.resolve4(hostname);
    if (!addrs?.length) throw new Error(`No IPv4 addresses for ${hostname}`);
    return addrs[0];
  };

  try {
    return await tryUdp();
  } catch (e1) {
    console.warn(
      "[nodemailer] UDP DNS failed, trying DoH then system resolver:",
      e1 instanceof Error ? e1.message : e1,
    );
  }

  const viaDoh = await resolve4ViaDoh(hostname);
  if (viaDoh) return viaDoh;

  try {
    const addrs = await dnsPromises.resolve4(hostname);
    if (addrs?.length) return addrs[0];
  } catch {
    // ignore
  }

  throw new Error(
    `Could not resolve ${hostname} (UDP DNS, DoH, and system resolver failed). ` +
      `Set NODEMAILER_SMTP_IP to a current Gmail SMTP IPv4 and NODEMAILER_TLS_SERVERNAME=smtp.gmail.com, or fix network DNS.`,
  );
}

async function createTransporterResolved(): Promise<Transporter> {
  const pass = normalizeSmtpPassword(
    stripEnvQuotes(process.env.NODEMAILER_PASSWORD ?? ""),
  );
  if (!pass) {
    throw new Error("NODEMAILER_PASSWORD is not set");
  }
  const user =
    stripEnvQuotes(process.env.NODEMAILER_USER ?? "") || getFromEmail();
  const smtpHostname = getSmtpHostname();
  const port = Number(process.env.NODEMAILER_PORT) || 465;
  const secure = port === 465;

  const staticIp = stripEnvQuotes(process.env.NODEMAILER_SMTP_IP ?? "");

  let connectHost: string;
  let tlsServername: string;
  if (staticIp && net.isIPv4(staticIp)) {
    connectHost = staticIp;
    tlsServername =
      stripEnvQuotes(process.env.NODEMAILER_TLS_SERVERNAME ?? "") ||
      (net.isIP(smtpHostname) ? "smtp.gmail.com" : smtpHostname);
  } else if (net.isIP(smtpHostname)) {
    connectHost = smtpHostname;
    tlsServername =
      stripEnvQuotes(process.env.NODEMAILER_TLS_SERVERNAME ?? "") ||
      smtpHostname;
  } else {
    connectHost = await resolveSmtpIPv4(smtpHostname);
    tlsServername = smtpHostname;
  }

  return nodemailer.createTransport({
    host: connectHost,
    port,
    secure,
    ...(port === 587 ? { requireTLS: true } : {}),
    auth: { user, pass },
    tls: {
      servername: tlsServername,
      rejectUnauthorized: true,
    },
    connectionTimeout: 45_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
    dnsTimeout: 30_000,
  });
}

async function getTransporterAsync(): Promise<Transporter> {
  if (transporter) return transporter;
  if (!buildInFlight) {
    buildInFlight = createTransporterResolved()
      .then((t) => {
        transporter = t;
        return t;
      })
      .finally(() => {
        buildInFlight = null;
      });
  }
  return buildInFlight;
}

/** Drop cached SMTP connection (e.g. after a failed send or stale socket in serverless). */
export function resetNodemailerTransport(): void {
  transporter = null;
  buildInFlight = null;
}

function isTransientSmtpError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EPIPE|socket|hang up|temporarily|451|452|421|4\.3\.2|4\.2\.2/i.test(
    msg,
  );
}

/** Map SMTP / transport errors to a short user-facing string (no stack traces). */
export function formatNodemailerErrorForClient(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);

  if (/queryA\s+ETIMEOUT|ENOTFOUND|getaddrinfo|\bEDNS\b|UDP DNS and DoH/i.test(msg)) {
    return (
      "Could not look up the mail server (DNS failure). The app tries UDP DNS, then DNS-over-HTTPS, " +
      "then the system resolver. If all fail, set NODEMAILER_SMTP_IP (Gmail SMTP IPv4) and " +
      "NODEMAILER_TLS_SERVERNAME=smtp.gmail.com, or fix network / allow HTTPS to dns.google."
    );
  }
  if (/timed out|timeout|ETIMEDOUT/i.test(msg)) {
    return "Email request timed out — check network or try again.";
  }
  if (/\bEAUTH\b|Invalid login|authentication failed|535|534/i.test(msg)) {
    return (
      "SMTP login failed. For Gmail, use an app password (not your normal password) and " +
      "confirm NODEMAILER_USER matches the account that generated the app password."
    );
  }
  if (/\b429\b|too many|rate limit|quota/i.test(msg)) {
    return "Email rate limit — wait a minute and try again.";
  }
  if (/self signed|certificate|TLS|SSL/i.test(msg)) {
    return "Could not establish a secure connection to the mail server.";
  }
  return "Could not send email. Try again later.";
}

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Low-level transactional send. Use typed helpers when possible.
 * Retries once after resetting the transport on transient SMTP/network errors.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const fromEmail = getFromEmail();
  const html =
    input.html ?? `<pre style="font-family:sans-serif">${escapeHtml(input.text)}</pre>`;
  const payload = {
    from: `"${getFromName()}" <${fromEmail}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html,
  };

  async function sendOnce(): Promise<void> {
    const transport = await getTransporterAsync();
    const info = await transport.sendMail(payload);
    if (!info.messageId) {
      console.warn("[nodemailer] sendMail returned without messageId", info);
    } else {
      console.info("[nodemailer] sent", { to: input.to, messageId: info.messageId });
    }
  }

  try {
    await sendOnce();
  } catch (e) {
    if (!isTransientSmtpError(e)) throw e;
    console.warn(
      "[nodemailer] transient SMTP error, resetting transport and retrying once:",
      e instanceof Error ? e.message : e,
    );
    resetNodemailerTransport();
    await sendOnce();
  }
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
 * Staff invite / credentials mail: sign-in email + password + login link (no OTP).
 */
export async function sendAdminInviteEmail(input: {
  to: string;
  name: string;
  /** Login identifier (same as `to` in normal cases). */
  loginEmail: string;
  /** Initial or newly issued password. */
  initialPassword: string;
  /** True when password is the well-known default — user must change after first sign-in. */
  isDefaultPassword: boolean;
  /** True when a new password was issued (e.g. resend); old password no longer works. */
  credentialsReset?: boolean;
}): Promise<void> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const label = process.env.NEXT_PUBLIC_APP_NAME ?? "Lucy Merchant";
  const subject = input.credentialsReset
    ? `${label} — new sign-in password`
    : `${label} — your administrator account`;
  const loginUrl = `${appUrl}/login`;

  /** Always show the canonical default when `isDefaultPassword` so the email matches `ADMIN_INVITE_DEFAULT_PASSWORD`. */
  const passwordForEmail = input.isDefaultPassword
    ? ADMIN_INVITE_DEFAULT_PASSWORD
    : input.initialPassword;

  const intro = input.credentialsReset
    ? "A new sign-in password was set for your staff account. Your previous password no longer works."
    : "An administrator created a staff account for you. Use the credentials below to sign in.";

  const lines = [
    `Hi ${input.name},`,
    "",
    intro,
    "",
    "Sign in",
    `  Email: ${input.loginEmail}`,
    `  Password: ${passwordForEmail}`,
    `  Open: ${loginUrl}`,
    "",
    input.isDefaultPassword
      ? [
          "Security — change your password",
          "Your account uses the default invite password. After you sign in, you must set a new password before using the admin workspace (you will be redirected to change password).",
          "",
        ].join("\n")
      : input.credentialsReset
        ? [
            "Security",
            "This password was generated for you. Change it after sign-in if your organization requires it.",
            "",
          ].join("\n")
        : [
            "Security",
            "Choose a unique password you do not use elsewhere. You can change it anytime under account settings.",
            "",
          ].join("\n"),
    "If you did not expect this message, contact your organization.",
  ];

  const text = lines.join("\n");

  const securityBlock = input.isDefaultPassword
    ? `<p style="margin:0;color:#b45309;border-left:4px solid #f59e0b;padding-left:12px"><strong>Default password:</strong> After first sign-in you must set a new password before using the admin workspace.</p>`
    : input.credentialsReset
      ? `<p style="margin:0;color:#444">This password was generated for you. Change it after sign-in if your organization requires it.</p>`
      : `<p style="margin:0;color:#444">Use a strong, unique password. You can change it anytime in account settings.</p>`;

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.55;color:#111">
    <p>Hi ${escapeHtml(input.name)},</p>
    <p>${escapeHtml(intro)}</p>
    <p style="margin-top:16px"><strong>Sign in</strong></p>
    <p style="margin:4px 0">Email: <code>${escapeHtml(input.loginEmail)}</code></p>
    <p style="margin:4px 0">Password: <code>${escapeHtml(passwordForEmail)}</code></p>
    <p style="margin-top:8px"><a href="${escapeHtml(loginUrl)}">Go to login</a></p>
    <p style="margin-top:20px"><strong>Security</strong></p>
    ${securityBlock}
    <p style="color:#666;font-size:14px;margin-top:20px">If you did not expect this message, contact your organization.</p>
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
