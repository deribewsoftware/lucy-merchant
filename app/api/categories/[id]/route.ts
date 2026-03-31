import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES } from "@/lib/admin-staff";
import { deleteCategory, updateCategory } from "@/lib/db/catalog";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { requireStaffPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  const perm = requireStaffPermission(auth.user.id, "categories:manage");
  if (!perm.ok) return perm.response;

  const rl = checkRateLimit(`catpatch:${auth.user.id}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many category edits. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const name =
    body?.name !== undefined ? String(body.name).trim() : undefined;
  const parentId =
    body?.parentId === undefined
      ? undefined
      : body?.parentId === null || body?.parentId === ""
        ? null
        : String(body.parentId);

  if (name === undefined && parentId === undefined) {
    return NextResponse.json(
      { error: "Provide name and/or parentId" },
      { status: 400 },
    );
  }

  const patch: { name?: string; parentId?: string | null } = {};
  if (name !== undefined) {
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    patch.name = name;
  }
  if (parentId !== undefined) patch.parentId = parentId;

  const updated = updateCategory(id, patch);
  if (!updated) {
    return NextResponse.json(
      { error: "Invalid update (not found, cycle, or empty name)" },
      { status: 400 },
    );
  }
  logStaffAction(request, {
    actorId: auth.user.id,
    action: "categories.patch",
    resource: id,
  });
  return NextResponse.json({ category: updated });
}

export async function DELETE(request: Request, context: Params) {
  const auth = await requireSession(ADMIN_STAFF_ROLES);
  if (!auth.ok) return auth.response;
  const perm = requireStaffPermission(auth.user.id, "categories:manage");
  if (!perm.ok) return perm.response;

  const rl = checkRateLimit(`catdel:${auth.user.id}`, 40, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many category deletes. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const result = deleteCategory(id);
  if (!result.ok) {
    const status = result.error === "Not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  logStaffAction(request, {
    actorId: auth.user.id,
    action: "categories.delete",
    resource: id,
  });
  return NextResponse.json({ ok: true });
}
