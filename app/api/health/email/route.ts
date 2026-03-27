import { NextResponse } from "next/server";
import { isSendGridConfigured } from "@/lib/email/sendgrid";

/**
 * No secrets. Use to confirm outbound email is configured (e.g. after deploy).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    sendgrid: {
      configured: isSendGridConfigured(),
    },
    time: new Date().toISOString(),
  });
}
