import { NextResponse } from "next/server";
import { addCategory, getCategories } from "@/lib/db/catalog";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function GET() {
  return NextResponse.json({ categories: getCategories() });
}

export async function POST(request: Request) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

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
  return NextResponse.json({ category });
}
