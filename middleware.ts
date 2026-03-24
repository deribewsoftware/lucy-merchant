import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecretKey } from "@/lib/auth/secret";
import type { UserRole } from "@/lib/domain/types";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("lm_token")?.value;

  let role: UserRole | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecretKey());
      role = payload.role as UserRole;
    } catch {
      role = null;
    }
  }

  const protectedPrefix =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/supplier") ||
    pathname.startsWith("/merchant");
  const notificationsArea = pathname.startsWith("/notifications");

  if ((protectedPrefix || notificationsArea) && !role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
  }
  if (pathname.startsWith("/supplier") && role !== "supplier") {
    return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
  }
  if (pathname.startsWith("/merchant") && role !== "merchant") {
    return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
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
  ],
};
