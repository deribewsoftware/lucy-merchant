import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { listAdminAudit } from "@/lib/db/admin-audit";
import { staffUserHasPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";

export async function GET(request: Request) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  if (!staffUserHasPermission(auth.user.id, "system:audit-read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(
    200,
    Math.max(1, Number(searchParams.get("limit") ?? "50") || 50),
  );
  const search = searchParams.get("q")?.trim() ?? "";
  const { entries, total } = listAdminAudit({
    offset,
    limit,
    search: search.length > 0 ? search : undefined,
  });
  return NextResponse.json({ entries, total, offset, limit, q: search || undefined });
}
