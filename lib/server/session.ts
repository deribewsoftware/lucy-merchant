import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import type { SessionUser } from "@/lib/domain/types";
import { findUserById } from "@/lib/db/users";

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get("lm_token")?.value;
  if (!token) return null;
  try {
    const p = await verifyToken(token);
    const row = findUserById(p.sub);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      name: row.name,
      authChannel: p.authChannel ?? "password",
    };
  } catch {
    return null;
  }
}
