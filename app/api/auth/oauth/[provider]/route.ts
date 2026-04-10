import { NextResponse } from "next/server";
import { signOAuthState, type OAuthIntent } from "@/lib/auth/oauth-state";
import {
  buildGoogleAuthorizeUrl,
  getGoogleOAuthCredentials,
  resolveGoogleOAuthRedirectUri,
} from "@/lib/auth/google-oauth";

function withOrigin(req: Request, pathname: string): URL {
  const u = new URL(req.url);
  const pathUrl = new URL(pathname, `${u.protocol}//${u.host}`);
  return pathUrl;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const intentRaw = url.searchParams.get("intent") ?? "login";
  const intent: OAuthIntent =
    intentRaw === "register" ? "register" : "login";
  const next = url.searchParams.get("next") ?? "/";
  const roleRaw = url.searchParams.get("role");
  const role =
    roleRaw === "merchant" || roleRaw === "supplier" ? roleRaw : undefined;

  if (provider !== "google") {
    const dest = withOrigin(req, "/login");
    dest.searchParams.set("error", "oauth");
    dest.searchParams.set("detail", "unsupported_provider");
    return NextResponse.redirect(dest);
  }

  const creds = getGoogleOAuthCredentials();
  if (!creds) {
    const dest = withOrigin(req, "/login");
    dest.searchParams.set("error", "oauth");
    dest.searchParams.set("detail", "google_not_configured");
    return NextResponse.redirect(dest);
  }

  const redirectUri = resolveGoogleOAuthRedirectUri(req);

  const state = await signOAuthState({
    intent,
    next,
    redirectUri,
    ...(intent === "register" ? { role: role ?? "merchant" } : {}),
  });
  const authorize = buildGoogleAuthorizeUrl({
    clientId: creds.clientId,
    state,
    redirectUri,
  });

  /** Web `Response.redirect` avoids any framework normalization of external `Location` URLs. */
  return Response.redirect(authorize, 302);
}
