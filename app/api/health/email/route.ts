import { NextResponse } from "next/server";
import { isNodemailerConfigured } from "@/lib/email/nodemailer";

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

/**
 * No secrets. Use to confirm outbound email is configured (e.g. after deploy).
 * Shows SMTP host/port and sender domain (not passwords).
 */
export async function GET() {
  const configured = isNodemailerConfigured();
  const fromRaw = stripEnvQuotes(process.env.NODEMAILER_FROM_EMAIL ?? "");
  const at = fromRaw.indexOf("@");
  const senderDomain =
    at > 0 ? fromRaw.slice(at + 1) : fromRaw ? "(set)" : null;
  const port = Number(process.env.NODEMAILER_PORT) || 465;
  const host = stripEnvQuotes(process.env.NODEMAILER_HOST ?? "") || "smtp.gmail.com";
  return NextResponse.json({
    ok: true,
    email: {
      provider: "nodemailer",
      configured,
      senderDomain,
      smtpHost: host,
      smtpPort: port,
      appUrlSet: Boolean(stripEnvQuotes(process.env.NEXT_PUBLIC_APP_URL ?? "")),
    },
    nodemailer: {
      configured,
    },
    time: new Date().toISOString(),
  });
}
