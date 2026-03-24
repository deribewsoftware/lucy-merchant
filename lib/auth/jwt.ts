import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/domain/types";
import { getJwtSecretKey } from "@/lib/auth/secret";

export type TokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
};

export async function signToken(
  payload: TokenPayload,
  maxAgeSec = 60 * 60 * 24 * 7,
): Promise<string> {
  const key = getJwtSecretKey();
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    name: payload.name,
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
  if (!sub) throw new Error("Invalid token");
  return {
    sub,
    email: String(payload.email),
    role: payload.role as UserRole,
    name: String(payload.name),
  };
}
