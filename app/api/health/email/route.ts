import { NextResponse } from "next/server";
import { isNodemailerConfigured } from "@/lib/email/nodemailer";

/**
 * No secrets. Use to confirm outbound email is configured (e.g. after deploy).
 */
export async function GET() {
  const configured = isNodemailerConfigured();
  return NextResponse.json({
    ok: true,
    email: {
      provider: "nodemailer",
      configured,
    },
    nodemailer: {
      configured,
    },
    time: new Date().toISOString(),
  });
}
