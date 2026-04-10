import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth/jwt";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { verifyOAuthState } from "@/lib/auth/oauth-state";
import {
  exchangeGoogleAuthorizationCode,
  getGoogleOAuthCredentials,
  GoogleTokenExchangeError,
  resolveGoogleOAuthRedirectUri,
} from "@/lib/auth/google-oauth";
import { defaultHomePath } from "@/lib/auth/portal-routes";
import {
  createUser,
  findUserByEmail,
  findUserById,
  markUserEmailVerified,
} from "@/lib/db/users";
import { notifySuperAdminsAdminNeedsAccess } from "@/lib/email/notify-super-admins-access";
import {
  effectiveStaffPermissions,
  getFirstAccessibleAdminHref,
} from "@/lib/server/admin-permissions";
import { logStaffLogin } from "@/lib/server/admin-audit-log";
import { assertRolePath } from "@/lib/rbac";
import type { UserRole } from "@/lib/domain/types";
import { setLmSessionCookie } from "@/lib/server/lm-session-cookie";

function redirectToLogin(req: Request, detail: string): NextResponse {
  const base = new URL(req.url);
  const dest = new URL("/login", `${base.protocol}//${base.host}`);
  dest.searchParams.set("error", "oauth");
  dest.searchParams.set("detail", detail);
  return NextResponse.redirect(dest);
}

function randomOAuthPassword(): string {
  const b = randomBytes(32);
  return `Aa1${b.toString("base64url")}`;
}

function displayNameFromGoogle(info: { name?: string; email: string }): string {
  const n = info.name?.trim();
  if (n && n.length >= 2) return n;
  const local = info.email.split("@")[0] ?? "User";
  return local.length >= 2 ? local : "Google user";
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  if (provider !== "google") {
    return redirectToLogin(req, "unsupported_provider");
  }

  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  if (err) {
    return redirectToLogin(req, "cancelled");
  }

  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");
  if (!code || !stateToken) {
    return redirectToLogin(req, "missing_code");
  }

  let state: Awaited<ReturnType<typeof verifyOAuthState>>;
  try {
    state = await verifyOAuthState(stateToken);
  } catch {
    return redirectToLogin(req, "bad_state");
  }

  const creds = getGoogleOAuthCredentials();
  if (!creds) {
    return redirectToLogin(req, "google_not_configured");
  }

  const redirectUri =
    state.redirectUri?.trim() || resolveGoogleOAuthRedirectUri(req);
  let googleUser: Awaited<ReturnType<typeof exchangeGoogleAuthorizationCode>>;
  try {
    googleUser = await exchangeGoogleAuthorizationCode(
      code,
      creds.clientId,
      creds.clientSecret,
      redirectUri,
    );
  } catch (e) {
    if (e instanceof GoogleTokenExchangeError) {
      if (e.oauthCode === "redirect_uri_mismatch") {
        return redirectToLogin(req, "oauth_redirect_mismatch");
      }
      if (e.oauthCode === "invalid_grant") {
        return redirectToLogin(req, "oauth_invalid_grant");
      }
    }
    return redirectToLogin(req, "token_exchange_failed");
  }

  let user = findUserByEmail(googleUser.email);

  if (!user) {
    const role: UserRole =
      state.intent === "register"
        ? (state.role ?? "merchant")
        : "merchant";
    if (role !== "merchant" && role !== "supplier") {
      return redirectToLogin(req, "invalid_role");
    }
    try {
      const { user: created } = await createUser({
        email: googleUser.email,
        password: randomOAuthPassword(),
        name: displayNameFromGoogle(googleUser),
        role,
        skipEmailVerification: true,
      });
      user = created;
    } catch {
      return redirectToLogin(req, "create_failed");
    }
  } else {
    if (!isEmailVerified(user)) {
      markUserEmailVerified(user.id);
      user = findUserById(user.id) ?? user;
    }
  }

  if (user.role === "admin" || user.role === "system_admin") {
    await notifySuperAdminsAdminNeedsAccess(user);
  }

  const adminAccessPending =
    user.role === "admin" && effectiveStaffPermissions(user.id).length === 0;

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    authChannel: "oauth",
  });

  const staffHomePath =
    user.role === "admin" || user.role === "system_admin"
      ? getFirstAccessibleAdminHref(user.id)
      : undefined;

  const fallback =
    user.role === "admin" || user.role === "system_admin"
      ? (staffHomePath ?? defaultHomePath(user.role, { adminAccessPending }))
      : defaultHomePath(user.role, { adminAccessPending });

  const allowLockedNext = (p: string) =>
    p.startsWith("/admin/settings") || p.startsWith("/admin/pending-access");

  let dest = state.next.startsWith("/") ? state.next : "/";
  if (dest && !assertRolePath(user.role, dest)) {
    dest = fallback;
  }
  if (adminAccessPending && dest && !allowLockedNext(dest)) {
    dest = "/admin/pending-access";
  }

  const base = new URL(req.url);
  if (user.mustChangePassword === true) {
    const cp = new URL("/change-password", `${base.protocol}//${base.host}`);
    cp.searchParams.set("required", "1");
    cp.searchParams.set("security", "oauth");
    cp.searchParams.set("next", dest);
    const res = NextResponse.redirect(cp);
    setLmSessionCookie(res, token);
    logStaffLogin(req, { userId: user.id, role: user.role });
    return res;
  }

  const res = NextResponse.redirect(new URL(dest, `${base.protocol}//${base.host}`));
  setLmSessionCookie(res, token);
  logStaffLogin(req, { userId: user.id, role: user.role });
  return res;
}
