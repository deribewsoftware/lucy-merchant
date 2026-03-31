import { NextResponse } from "next/server";
import { validatePasswordStrength } from "@/lib/auth/register-validation";
import { verifyPassword } from "@/lib/auth/password";
import { findUserById, updateUserPassword } from "@/lib/db/users";
import { requireSession } from "@/lib/server/require-session";

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const { currentPassword, password, confirmPassword } = body as {
    currentPassword?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!currentPassword || !password || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const strengthErr = validatePasswordStrength(password);
  if (strengthErr) {
    return NextResponse.json({ error: strengthErr }, { status: 400 });
  }

  const row = findUserById(auth.user.id);
  if (!row) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const match = await verifyPassword(currentPassword, row.passwordHash);
  if (!match) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  await updateUserPassword(auth.user.id, password);

  return NextResponse.json({ ok: true, message: "Password updated successfully" });
}
