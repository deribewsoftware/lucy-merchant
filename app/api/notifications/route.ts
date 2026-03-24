import { NextResponse } from "next/server";
import {
  listNotificationsForUser,
  markAllReadForUser,
  markNotificationRead,
  unreadCountForUser,
} from "@/lib/db/notifications";
import { requireSession } from "@/lib/server/require-session";

export async function GET(request: Request) {
  const auth = await requireSession(["merchant", "supplier", "admin"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("count") === "1") {
    return NextResponse.json({
      unread: unreadCountForUser(auth.user.id),
    });
  }

  const limit = Math.min(
    100,
    Math.max(5, Number(searchParams.get("limit") ?? 40)),
  );
  const items = listNotificationsForUser(auth.user.id, limit);
  return NextResponse.json({
    notifications: items,
    unread: unreadCountForUser(auth.user.id),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireSession(["merchant", "supplier", "admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (body?.all === true) {
    markAllReadForUser(auth.user.id);
    return NextResponse.json({ ok: true });
  }
  const id = String(body?.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const ok = markNotificationRead(auth.user.id, id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
