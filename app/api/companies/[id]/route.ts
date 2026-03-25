import { NextResponse } from "next/server";
import {
  getCompany,
  setCompanyVerified,
  updateCompany,
} from "@/lib/db/catalog";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const company = getCompany(id);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ company });
}

export async function PATCH(request: Request, context: Params) {
  const auth = await requireSession(["admin", "supplier"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (auth.user.role === "admin") {
    if (typeof body?.isVerified !== "boolean") {
      return NextResponse.json(
        { error: "Admin PATCH requires isVerified (boolean)" },
        { status: 400 },
      );
    }
    const updated = setCompanyVerified(id, body.isVerified);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ company: updated });
  }

  const company = getCompany(id);
  if (!company || company.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = checkRateLimit(`coupdate:${auth.user.id}`, 40, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many updates. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const patch: Parameters<typeof updateCompany>[1] = {};
  if (body?.name !== undefined) patch.name = String(body.name);
  if (body?.description !== undefined) {
    patch.description = String(body.description);
  }
  if (body?.licenseDocument !== undefined) {
    patch.licenseDocument = body.licenseDocument
      ? String(body.licenseDocument)
      : "";
  }
  if (body?.logo !== undefined) {
    patch.logo = body.logo ? String(body.logo) : "";
  }
  if (body?.businessAddress !== undefined) {
    patch.businessAddress = String(body.businessAddress ?? "");
  }
  if (body?.latitude !== undefined) {
    if (body.latitude === null || body.latitude === "") {
      patch.latitude = null;
    } else {
      const n = Number(body.latitude);
      patch.latitude = Number.isFinite(n) ? n : null;
    }
  }
  if (body?.longitude !== undefined) {
    if (body.longitude === null || body.longitude === "") {
      patch.longitude = null;
    } else {
      const n = Number(body.longitude);
      patch.longitude = Number.isFinite(n) ? n : null;
    }
  }
  if (body?.settlementBankName !== undefined) {
    patch.settlementBankName = String(body.settlementBankName ?? "");
  }
  if (body?.settlementAccountName !== undefined) {
    patch.settlementAccountName = String(body.settlementAccountName ?? "");
  }
  if (body?.settlementAccountNumber !== undefined) {
    patch.settlementAccountNumber = String(body.settlementAccountNumber ?? "");
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      {
        error:
          "Provide at least one field to update (including settlement bank details)",
      },
      { status: 400 },
    );
  }

  const updated = updateCompany(id, patch);
  if (!updated) {
    return NextResponse.json(
      { error: "Invalid data (empty name or description?)" },
      { status: 400 },
    );
  }
  return NextResponse.json({ company: updated });
}
