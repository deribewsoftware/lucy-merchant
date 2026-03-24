import { NextResponse } from "next/server";
import { deleteProductCommentById } from "@/lib/db/comments";
import { requireSession } from "@/lib/server/require-session";

type Params = { params: Promise<{ commentId: string }> };

export async function DELETE(_request: Request, context: Params) {
  const auth = await requireSession(["admin"]);
  if (!auth.ok) return auth.response;

  const { commentId } = await context.params;
  const ok = deleteProductCommentById(commentId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
