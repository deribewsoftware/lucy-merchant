import type { NextResponse } from "next/server";

/** HttpOnly session JWT; must match `lib/server/session.ts` and `require-session.ts`. */
export const LM_SESSION_COOKIE = "lm_token";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function setLmSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(LM_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}
