import { NextResponse } from "next/server";
import { isDataClearFeatureId } from "@/lib/domain/data-clear-features";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { clearFeatureData } from "@/lib/server/clear-feature-data";
import { requireSession } from "@/lib/server/require-session";

export async function POST(request: Request) {
  const auth = await requireSession(["system_admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const feature = typeof body?.feature === "string" ? body.feature : "";
  if (!isDataClearFeatureId(feature)) {
    return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
  }

  await clearFeatureData(feature);

  if (feature !== "audit" && feature !== "all") {
    logStaffAction(request, {
      actorId: auth.user.id,
      action: "data.clear",
      resource: feature,
    });
  }

  return NextResponse.json({ ok: true, feature });
}
