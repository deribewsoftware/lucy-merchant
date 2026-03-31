import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { addCategory, getCategories } from "@/lib/db/catalog";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { requireStaffPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function GET() {
  return NextResponse.json({ categories: getCategories() });
}

export async function POST(request: Request) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  const perm = requireStaffPermission(auth.user.id, "categories:manage");
  if (!perm.ok) return perm.response;

  const rl = checkRateLimit(`catadd:${auth.user.id}`, 40, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many new categories. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const parentId =
    body?.parentId === null || body?.parentId === undefined
      ? null
      : String(body.parentId);
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const category = addCategory(name, parentId);
  logStaffAction(request, {
    actorId: auth.user.id,
    action: "categories.create",
    resource: category.id,
    detail: { name: category.name },
  });
  return NextResponse.json({ category });
}
