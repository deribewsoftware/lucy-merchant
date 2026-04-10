import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import type { SessionUser, UserRole } from "@/lib/domain/types";
import { findUserById } from "@/lib/db/users";

export async function requireSession(roles?: UserRole[]): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }
> {
  const jar = await cookies();
  const token = jar.get("lm_token")?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  try {
    const p = await verifyToken(token);
    const row = findUserById(p.sub);
    if (!row) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    const user: SessionUser = {
      id: row.id,
      email: row.email,
      role: row.role,
      name: row.name,
      authChannel: p.authChannel ?? "password",
    };
    if (roles && !roles.includes(user.role)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
    return { ok: true, user };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}
