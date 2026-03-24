import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import type { SessionUser, UserRole } from "@/lib/domain/types";

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
    const user: SessionUser = {
      id: p.sub,
      email: p.email,
      role: p.role,
      name: p.name,
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
