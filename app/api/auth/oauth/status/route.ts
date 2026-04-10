import { NextResponse } from "next/server";
import { getGoogleOAuthCredentials } from "@/lib/auth/google-oauth";

/** Whether server-side Google OAuth is configured (no secrets exposed). */
export async function GET() {
  return NextResponse.json({
    google: getGoogleOAuthCredentials() !== null,
  });
}
