import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import type { SessionUser } from "@/lib/domain/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get("lm_token")?.value;
  if (!token) return null;
  try {
    const p = await verifyToken(token);
    return { id: p.sub, email: p.email, role: p.role, name: p.name };
  } catch {
    return null;
  }
}
