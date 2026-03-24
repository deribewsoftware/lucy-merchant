import { NextResponse } from "next/server";
import { findUserById } from "@/lib/db/users";
import { requireSession } from "@/lib/server/require-session";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const row = findUserById(auth.user.id);
  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.user.role,
      name: auth.user.name,
      points: row?.points,
    },
  });
}
