import { getOAuthServerBaseUrl } from "@/lib/app-url";

function stripEnvQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

const CALLBACK_PATH = "/api/auth/oauth/google/callback";

/** Prefer `GOOGLE_OAUTH_REDIRECT_URI`; also accept `GOOGLE_REDIRECT_URI` (common typo in .env). */
export function oauthRedirectUriOverrideFromEnv(): string {
  const primary = stripEnvQuotes(process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "");
  if (primary) return primary;
  return stripEnvQuotes(process.env.GOOGLE_REDIRECT_URI ?? "");
}

export function getGoogleOAuthCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = stripEnvQuotes(process.env.GOOGLE_CLIENT_ID ?? "");
  const clientSecret = stripEnvQuotes(process.env.GOOGLE_CLIENT_SECRET ?? "");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Fallback when no `Request` is available (must match a URI registered in Google Cloud). */
export function googleOAuthRedirectUri(): string {
  const explicit = oauthRedirectUriOverrideFromEnv();
  if (explicit) return explicit.replace(/\/$/, "");
  const base = getOAuthServerBaseUrl();
  return `${base.replace(/\/$/, "")}${CALLBACK_PATH}`;
}

/**
 * Local/dev only: build redirect URI from the incoming request (localhost ports, etc.).
 * In production, request Host often differs from what is registered in Google (www vs apex,
 * preview URLs, proxies) and causes `redirect_uri_mismatch` — use canonical URL instead.
 */
function inferRedirectUriFromRequest(req: Request): string {
  const u = new URL(req.url);
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || u.host;
  if (!host) {
    return googleOAuthRedirectUri();
  }

  let proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()?.toLowerCase() ||
    "";
  if (!proto) {
    proto = u.protocol === "https:" ? "https" : u.protocol === "http:" ? "http" : "https";
  }
  if (proto !== "http" && proto !== "https") {
    proto = "https";
  }

  const isLocal =
    host.startsWith("localhost:") ||
    host === "localhost" ||
    host.startsWith("127.0.0.1");
  if (isLocal && proto !== "http" && u.protocol === "http:") {
    proto = "http";
  }

  const origin = `${proto}://${host}`.replace(/\/$/, "");
  return `${origin}${CALLBACK_PATH}`;
}

function isLocalDevHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * In dev, `.env` often hard-codes `http://localhost:3000/.../callback` while `next dev` runs on
 * another port → Google shows `redirect_uri_mismatch`. If both env and request are localhost but
 * origins differ, use the request origin so it matches the browser and Google Console.
 */
function preferInferredRedirectOverExplicitInDev(
  explicitNormalized: string,
  req: Request,
): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const inferred = inferRedirectUriFromRequest(req);
    const expUrl = new URL(explicitNormalized);
    const infUrl = new URL(inferred);
    if (!isLocalDevHost(expUrl.hostname) || !isLocalDevHost(infUrl.hostname)) {
      return false;
    }
    const expOrigin = `${expUrl.protocol}//${expUrl.host}`;
    const infOrigin = `${infUrl.protocol}//${infUrl.host}`;
    return expOrigin !== infOrigin;
  } catch {
    return false;
  }
}

/**
 * Redirect URI sent to Google — must be **byte-identical** in authorize + token requests and
 * listed exactly in Google Cloud → Credentials → OAuth client → Authorized redirect URIs.
 *
 * Priority:
 * 1. `GOOGLE_OAUTH_REDIRECT_URI` or `GOOGLE_REDIRECT_URI` (exact URI registered in Google Cloud).
 * 2. Production: `APP_BASE_URL` (server runtime) or `NEXT_PUBLIC_APP_URL` / default + callback path.
 * 3. Development: infer from request (localhost / dev server port).
 */
export function resolveGoogleOAuthRedirectUri(req: Request): string {
  const explicit = oauthRedirectUriOverrideFromEnv();
  if (explicit) {
    const normalized = explicit.replace(/\/$/, "");
    if (preferInferredRedirectOverExplicitInDev(normalized, req)) {
      return inferRedirectUriFromRequest(req);
    }
    return normalized;
  }

  if (process.env.NODE_ENV === "production") {
    return googleOAuthRedirectUri();
  }

  return inferRedirectUriFromRequest(req);
}

export function googleOAuthRedirectUriResolutionLabel(req: Request): string {
  const o = oauthRedirectUriOverrideFromEnv();
  if (o) {
    const normalized = o.replace(/\/$/, "");
    if (preferInferredRedirectOverExplicitInDev(normalized, req)) {
      return "request_local_dev (overrode env: host/port mismatch with GOOGLE_*_REDIRECT_URI)";
    }
    return stripEnvQuotes(process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "")
      ? "GOOGLE_OAUTH_REDIRECT_URI"
      : "GOOGLE_REDIRECT_URI";
  }
  if (process.env.NODE_ENV === "production") {
    return stripEnvQuotes(process.env.APP_BASE_URL ?? "").length > 0
      ? "APP_BASE_URL"
      : "NEXT_PUBLIC_APP_URL_OR_DEFAULT";
  }
  return "request_local_dev";
}

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

export function buildGoogleAuthorizeUrl(params: {
  clientId: string;
  state: string;
  redirectUri: string;
}): string {
  /**
   * Build query explicitly: `response_type` must always reach Google (some clients/proxies truncate
   * long Location URLs — keep short required params first, long `state` JWT last).
   * @see https://developers.google.com/identity/protocols/oauth2/web-server#creatingauthuri
   */
  const q = [
    `response_type=${encodeURIComponent("code")}`,
    `client_id=${encodeURIComponent(params.clientId)}`,
    `redirect_uri=${encodeURIComponent(params.redirectUri)}`,
    `scope=${encodeURIComponent("openid email profile")}`,
    `prompt=${encodeURIComponent("select_account")}`,
    `state=${encodeURIComponent(params.state)}`,
  ].join("&");
  return `${GOOGLE_AUTH}?${q}`;
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export type GoogleOAuthTokenErrorCode =
  | "redirect_uri_mismatch"
  | "invalid_grant"
  | "unknown";

export class GoogleTokenExchangeError extends Error {
  readonly oauthCode: GoogleOAuthTokenErrorCode;

  constructor(oauthCode: GoogleOAuthTokenErrorCode, message: string) {
    super(message);
    this.name = "GoogleTokenExchangeError";
    this.oauthCode = oauthCode;
  }
}

function parseGoogleTokenErrorBody(text: string): GoogleOAuthTokenErrorCode {
  try {
    const j = JSON.parse(text) as { error?: string };
    const e = String(j.error ?? "");
    if (e === "redirect_uri_mismatch") return "redirect_uri_mismatch";
    if (e === "invalid_grant") return "invalid_grant";
  } catch {
    /* ignore */
  }
  if (text.includes("redirect_uri_mismatch")) return "redirect_uri_mismatch";
  if (text.includes("invalid_grant")) return "invalid_grant";
  return "unknown";
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<GoogleUserInfo> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text().catch(() => "");
    const oauthCode = parseGoogleTokenErrorBody(t);
    throw new GoogleTokenExchangeError(
      oauthCode,
      `Google token exchange failed: ${tokenRes.status} ${t.slice(0, 280)}`,
    );
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  const accessToken = tokenJson.access_token;
  if (!accessToken) throw new Error("Google token response missing access_token");

  const userRes = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    const t = await userRes.text().catch(() => "");
    throw new Error(`Google userinfo failed: ${userRes.status} ${t.slice(0, 200)}`);
  }
  const u = (await userRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  const email = String(u.email ?? "").trim().toLowerCase();
  const sub = String(u.sub ?? "").trim();
  if (!email || !sub) throw new Error("Google account has no usable email");
  if (u.email_verified === false) {
    throw new Error("Google email is not verified");
  }
  return {
    sub,
    email,
    email_verified: u.email_verified,
    name: u.name?.trim(),
    picture: u.picture,
  };
}
