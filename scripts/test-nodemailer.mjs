/**
 * Smoke test — matches lib/email/nodemailer.ts: Resolver + connect by IP + tls.servername.
 *
 *   NODEMAILER_FROM_EMAIL=... NODEMAILER_PASSWORD=... node scripts/test-nodemailer.mjs you@example.com
 */
import { Resolver } from "node:dns/promises";
import net from "node:net";
import nodemailer from "nodemailer";

function stripQuotes(s) {
  const t = String(s ?? "").trim();
  if (t.length >= 2) {
    const a = t[0];
    const b = t[t.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) return t.slice(1, -1).trim();
  }
  return t;
}

function normalizePass(raw) {
  return stripQuotes(raw).replace(/\s+/g, "");
}

function smtpResolverDnsServers(smtpHostname) {
  const raw = stripQuotes(process.env.NODEMAILER_DNS_SERVERS ?? "");
  if (raw) return raw.split(/[\s,]+/).filter(Boolean);
  const optOut = stripQuotes(process.env.NODEMAILER_DISABLE_PUBLIC_DNS_FALLBACK ?? "").toLowerCase();
  if (optOut === "1" || optOut === "true" || optOut === "yes") return [];
  if (smtpHostname === "smtp.gmail.com") return ["8.8.8.8", "8.8.4.4"];
  return [];
}

async function resolveSmtpIPv4(hostname) {
  const servers = smtpResolverDnsServers(hostname);
  const resolver = new Resolver();
  resolver.setServers(servers.length > 0 ? servers : []);
  const addrs = await resolver.resolve4(hostname);
  return addrs[0];
}

const fromEmail = stripQuotes(process.env.NODEMAILER_FROM_EMAIL);
const password = normalizePass(process.env.NODEMAILER_PASSWORD);
const user = stripQuotes(process.env.NODEMAILER_USER) || fromEmail;
const smtpHostname = stripQuotes(process.env.NODEMAILER_HOST) || "smtp.gmail.com";
const port = Number(process.env.NODEMAILER_PORT) || 465;
const secure = port === 465;

const recipient = process.argv[2];

if (!fromEmail || !password) {
  console.error("Set NODEMAILER_FROM_EMAIL and NODEMAILER_PASSWORD in the environment.");
  process.exit(1);
}

if (!recipient || !recipient.includes("@")) {
  console.error("Usage: node scripts/test-nodemailer.mjs <recipient@email.com>");
  process.exit(1);
}

let connectHost;
let tlsServername;
if (net.isIP(smtpHostname)) {
  connectHost = smtpHostname;
  tlsServername = stripQuotes(process.env.NODEMAILER_TLS_SERVERNAME ?? "") || smtpHostname;
} else {
  try {
    connectHost = await resolveSmtpIPv4(smtpHostname);
    tlsServername = smtpHostname;
    console.log("Resolved", smtpHostname, "->", connectHost);
  } catch (e) {
    console.error("DNS resolve failed:", e);
    process.exit(1);
  }
}

const transport = nodemailer.createTransport({
  host: connectHost,
  port,
  secure,
  ...(port === 587 ? { requireTLS: true } : {}),
  auth: { user, pass: password },
  tls: {
    servername: tlsServername,
    rejectUnauthorized: true,
  },
  connectionTimeout: 45_000,
  greetingTimeout: 30_000,
  socketTimeout: 60_000,
  dnsTimeout: 30_000,
});

const text = "If you received this, Nodemailer SMTP is configured correctly.";
const html = "<p>If you received this, Nodemailer SMTP is configured correctly.</p>";

try {
  const info = await transport.sendMail({
    from: `"Lucy Merchant test" <${fromEmail}>`,
    to: recipient,
    subject: "Lucy Merchant — Nodemailer test",
    text,
    html,
  });
  console.log("Sent:", info.messageId ?? "(no messageId)");
} catch (e) {
  console.error("Send failed:", e);
  process.exit(1);
}
