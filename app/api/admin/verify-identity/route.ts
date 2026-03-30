import { NextResponse } from "next/server";
import {
  findUserById,
  listPendingNationalIdUsers,
  reviewNationalId,
} from "@/lib/db/users";
import { notifyUserVerificationResult } from "@/lib/db/notifications";
import { requireSession } from "@/lib/server/require-session";

export async function GET() {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const pending = listPendingNationalIdUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    nationalIdName: u.nationalIdName,
    nationalIdFrontImage: u.nationalIdFrontImage,
    nationalIdBackImage: u.nationalIdBackImage,
    nationalIdSubmittedAt: u.nationalIdSubmittedAt,
  }));

  return NextResponse.json({ users: pending });
}

export async function PATCH(request: Request) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  const approved = body?.approved;
  const reason = body?.reason ? String(body.reason).trim() : undefined;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (typeof approved !== "boolean") {
    return NextResponse.json(
      { error: "approved (boolean) is required" },
      { status: 400 },
    );
  }

  if (!approved && !reason) {
    return NextResponse.json(
      { error: "A rejection reason is required when declining" },
      { status: 400 },
    );
  }

  const user = findUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.nationalIdStatus !== "pending") {
    return NextResponse.json(
      { error: "User does not have a pending ID verification" },
      { status: 400 },
    );
  }

  const updated = reviewNationalId(userId, approved, auth.user.id, reason);
  if (!updated) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  notifyUserVerificationResult(userId, approved, reason);

  return NextResponse.json({
    status: updated.nationalIdStatus,
    message: approved ? "Verification approved" : "Verification rejected",
  });
}
