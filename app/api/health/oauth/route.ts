import { NextResponse } from "next/server";
import {
  getGoogleOAuthCredentials,
  googleOAuthRedirectUriResolutionLabel,
  oauthRedirectUriOverrideFromEnv,
  resolveGoogleOAuthRedirectUri,
} from "@/lib/auth/google-oauth";
import { getOAuthServerBaseUrl, getPublicAppUrl } from "@/lib/app-url";

const MISMATCH_CHECKLIST = [
  "Open the OAuth client in Google Cloud whose Client ID equals googleOAuthClientId below (not a different project or iOS/Android client).",
  "Under Authorized redirect URIs, click Add URI and paste redirectUri exactly — same scheme (http/https), host, port, and path /api/auth/oauth/google/callback (word is callback, not caalback).",
  "Save, wait ~1 minute, try Sign in with Google again (or use an incognito window).",
  "If deploy is on Vercel: set GOOGLE_OAUTH_REDIRECT_URI to that exact redirectUri, or set APP_BASE_URL to https://your-domain.com with no trailing slash.",
];

/**
 * Debug redirect_uri without secrets. Open on the same host you use for login (or production URL).
 */
export async function GET(req: Request) {
  const creds = getGoogleOAuthCredentials();
  const redirectUri = resolveGoogleOAuthRedirectUri(req);
  const isLocal =
    redirectUri.startsWith("http://localhost") ||
    redirectUri.startsWith("http://127.0.0.1");

  return NextResponse.json({
    ok: true,
    googleOAuthClientConfigured: Boolean(creds),
    /** Use this Client ID to pick the correct credential row in Google Cloud. */
    googleOAuthClientId: creds?.clientId ?? null,
    redirectUri,
    redirectUriSource: googleOAuthRedirectUriResolutionLabel(req),
    envRedirectOverride: Boolean(oauthRedirectUriOverrideFromEnv()),
    oauthServerBaseUrl: getOAuthServerBaseUrl(),
    publicAppUrl: getPublicAppUrl(),
    redirectUriMismatchChecklist: MISMATCH_CHECKLIST,
    hint:
      "redirectUri must appear exactly under Authorized redirect URIs for the Web client matching googleOAuthClientId.",
    ...(isLocal
      ? {
          localhostSetup:
            "For local dev, Google must list http://localhost:PORT/api/auth/oauth/google/callback (same PORT as npm run dev). See https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch",
        }
      : {}),
  });
}
