import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/domain/types";
import { getJwtSecretKey } from "@/lib/auth/secret";

export type AuthChannel = "password" | "oauth";

export type TokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
  /** How this session was established; affects forced password change flows. */
  authChannel?: AuthChannel;
};

export async function signToken(
  payload: TokenPayload,
  maxAgeSec = 60 * 60 * 24 * 7,
): Promise<string> {
  const key = getJwtSecretKey();
  const channel = payload.authChannel ?? "password";
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    name: payload.name,
    ...(channel !== "password" ? { authChannel: channel } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(key);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const key = getJwtSecretKey();
  const { payload } = await jwtVerify(token, key);
  const sub = payload.sub;
  if (sub === undefined || sub === null) throw new Error("Invalid token");
  const ch = payload.authChannel;
  const authChannel: AuthChannel =
    ch === "oauth" ? "oauth" : "password";
  return {
    sub: String(sub),
    email: String(payload.email),
    role: payload.role as UserRole,
    name: String(payload.name),
    authChannel,
  };
}
