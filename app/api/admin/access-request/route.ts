import { NextResponse } from "next/server";
import { findUserById } from "@/lib/db/users";
import { notifySuperAdminsAdminNeedsAccess } from "@/lib/email/notify-super-admins-access";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { requireSession } from "@/lib/server/require-session";

/** Resend “needs permissions” email to system admins (same throttle as login). */
export async function POST() {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;

  const row = findUserById(auth.user.id);
  if (!row || row.role !== "admin") {
    return NextResponse.json({ error: "Only for administrator accounts" }, { status: 400 });
  }

  await notifySuperAdminsAdminNeedsAccess(row);
  return NextResponse.json({ ok: true });
}
