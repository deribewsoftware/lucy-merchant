import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretKey } from "@/lib/auth/secret";

export type OAuthIntent = "login" | "register";

export type OAuthStatePayload = {
  intent: OAuthIntent;
  /** Relative path only; validated when issuing and consuming. */
  next: string;
  /** Required for intent=register when creating a new account. */
  role?: "merchant" | "supplier";
  /**
   * Exact Google OAuth redirect_uri used in authorize + token steps (must match Google Console).
   * Present on new flows; older state falls back to resolving from the callback request.
   */
  redirectUri?: string;
};

const STATE_MAX_AGE_SEC = 600;

const CALLBACK_SUFFIX = "/api/auth/oauth/google/callback";

function isValidOAuthRedirectUri(raw: string): boolean {
  const s = raw.trim();
  if (s.length < 32 || s.length > 512) return false;
  if (!s.endsWith(CALLBACK_SUFFIX)) return false;
  if (!s.startsWith("https://")) {
    if (!s.startsWith("http://localhost") && !s.startsWith("http://127.0.0.1")) {
      return false;
    }
  }
  try {
    const u = new URL(s);
    return `${u.pathname}` === CALLBACK_SUFFIX;
  } catch {
    return false;
  }
}

function sanitizeNext(raw: string): string {
  const n = raw.trim() || "/";
  if (!n.startsWith("/") || n.startsWith("//")) return "/";
  return n;
}

export async function signOAuthState(payload: OAuthStatePayload): Promise<string> {
  const key = getJwtSecretKey();
  const next = sanitizeNext(payload.next);
  const role =
    payload.role === "merchant" || payload.role === "supplier"
      ? payload.role
      : undefined;
  const redirectUri =
    payload.redirectUri && isValidOAuthRedirectUri(payload.redirectUri)
      ? payload.redirectUri.trim()
      : undefined;
  if (!redirectUri) {
    throw new Error("OAuth state requires a valid redirectUri");
  }
  return new SignJWT({
    intent: payload.intent,
    next,
    redirectUri,
    ...(role ? { role } : {}),
    lmOAuthState: "v1",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STATE_MAX_AGE_SEC}s`)
    .sign(key);
}

export async function verifyOAuthState(token: string): Promise<OAuthStatePayload> {
  const key = getJwtSecretKey();
  const { payload } = await jwtVerify(token, key);
  if (payload.lmOAuthState !== "v1") throw new Error("Invalid OAuth state");
  const intent = payload.intent;
  if (intent !== "login" && intent !== "register") throw new Error("Invalid OAuth intent");
  const next = sanitizeNext(String(payload.next ?? "/"));
  const r = payload.role;
  const role =
    r === "merchant" || r === "supplier" ? r : undefined;
  const ru = payload.redirectUri;
  const redirectUri =
    typeof ru === "string" && isValidOAuthRedirectUri(ru) ? ru.trim() : undefined;
  return { intent, next, role, redirectUri };
}
