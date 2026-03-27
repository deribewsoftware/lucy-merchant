import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { getMongoDb } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth/jwt";
import { validatePasswordStrength } from "@/lib/auth/register-validation";

export async function POST(req: NextRequest) {
  try {
    /* ── Authenticate ───────────────────────────────────── */
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token).catch(() => null);
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    /* ── Parse body ─────────────────────────────────────── */
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

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

    /* ── Verify current password ────────────────────────── */
    const db = await getMongoDb();
    const user = await db.collection("users").findOne({ email: payload.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const match = await compare(currentPassword, user.password);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    /* ── Update password ────────────────────────────────── */
    const hashed = await hash(password, 12);
    await db.collection("users").updateOne(
      { email: payload.email },
      { $set: { password: hashed, updatedAt: new Date() } },
    );

    return NextResponse.json({ message: "Password updated successfully" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
