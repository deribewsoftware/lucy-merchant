/**
 * Next.js 16+ “proxy” middleware — keep portal auth logic here only.
 * Do not add a separate `middleware.ts`; the build fails if both exist.
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { defaultHomePath } from "@/lib/auth/portal-routes";
import { getJwtSecretKey } from "@/lib/auth/secret";
import type { UserRole } from "@/lib/domain/types";
import { isStaffAdminRole } from "@/lib/admin-staff";
import { findUserById } from "@/lib/db/users";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("lm_token")?.value;

  let role: UserRole | null = null;
  let tokenUserId: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecretKey());
      tokenUserId = typeof payload.sub === "string" ? payload.sub : null;
      if (tokenUserId) {
        const row = findUserById(tokenUserId);
        role = row?.role ?? null;
      }
    } catch {
      role = null;
      tokenUserId = null;
    }
  }

  const protectedPrefix =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/supplier") ||
    pathname.startsWith("/merchant");
  const notificationsArea = pathname.startsWith("/notifications");
  const changePasswordPage = pathname.startsWith("/change-password");

  /** Password change requires an existing session. */
  if (changePasswordPage && !role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  if ((protectedPrefix || notificationsArea) && !role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role && !isStaffAdminRole(role)) {
    const url = request.nextUrl.clone();
    url.pathname = defaultHomePath(role);
    url.searchParams.set("notice", "wrong_portal");
    return NextResponse.redirect(url);
  }

  /** Invited administrators with the default password must change it before staff areas load. */
  if (
    tokenUserId &&
    role &&
    isStaffAdminRole(role) &&
    (pathname.startsWith("/admin") || pathname.startsWith("/notifications"))
  ) {
    const row = findUserById(tokenUserId);
    if (row?.mustChangePassword === true) {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      url.searchParams.set("required", "1");
      url.searchParams.set("security", "default");
      url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/supplier") && role && role !== "supplier") {
    const url = request.nextUrl.clone();
    url.pathname = defaultHomePath(role);
    url.searchParams.set("notice", "wrong_portal");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/merchant") && role && role !== "merchant") {
    const url = request.nextUrl.clone();
    url.pathname = defaultHomePath(role);
    url.searchParams.set("notice", "wrong_portal");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/supplier/:path*",
    "/merchant/:path*",
    "/notifications",
    "/notifications/:path*",
    "/change-password",
    "/change-password/:path*",
  ],
};
