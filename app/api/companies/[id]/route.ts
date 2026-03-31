import { NextResponse } from "next/server";
import {
  deleteProduct,
  getCompany,
  listProducts,
  removeCompanyRecord,
  setCompanyVerified,
  updateCompany,
} from "@/lib/db/catalog";
import { deleteCommentsForProduct } from "@/lib/db/comments";
import { removeProductFromAllCarts } from "@/lib/db/commerce";
import { deleteAllReviewsForCompany } from "@/lib/db/reviews";
import { deleteReviewsForProduct } from "@/lib/db/product-reviews";
import { notifySupplierCompanyVerificationResult } from "@/lib/db/notifications";
import { isStaffAdminRole } from "@/lib/admin-staff";
import { logStaffAction } from "@/lib/server/admin-audit-log";
import { requireStaffPermission } from "@/lib/server/admin-permissions";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { companyApprovedOrVerified } from "@/lib/domain/types";
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission";
import { API_SUPPLIER_COMMISSION_SUSPENDED } from "@/lib/domain/commission-hold-copy";

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
  const auth = await requireSession(["admin", "system_admin", "supplier"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (isStaffAdminRole(auth.user.role)) {
    const perm = requireStaffPermission(auth.user.id, "companies:verify");
    if (!perm.ok) return perm.response;
    if (typeof body?.isVerified !== "boolean") {
      return NextResponse.json(
        { error: "Admin PATCH requires isVerified (boolean)" },
        { status: 400 },
      );
    }
    if (!body.isVerified && !body.rejectionReason) {
      return NextResponse.json(
        { error: "A rejection reason is required when declining" },
        { status: 400 },
      );
    }
    const rejectionReason = body.rejectionReason
      ? String(body.rejectionReason).trim()
      : undefined;
    const updated = setCompanyVerified(id, body.isVerified, auth.user.id, rejectionReason);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    notifySupplierCompanyVerificationResult(id, body.isVerified, rejectionReason);
    logStaffAction(request, {
      actorId: auth.user.id,
      action: "companies.verify",
      resource: id,
      detail: { isVerified: body.isVerified },
    });
    return NextResponse.json({ company: updated });
  }

  const company = getCompany(id);
  if (!company || company.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (companyApprovedOrVerified(company)) {
    return NextResponse.json(
      {
        error:
          "This company is verified and its profile cannot be changed. Remove all product listings, then you can remove the company if you no longer need it.",
      },
      { status: 403 },
    );
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
  if (body?.tinNumber !== undefined) {
    patch.tinNumber = String(body.tinNumber ?? "");
  }
  if (body?.tradeLicenseNumber !== undefined) {
    patch.tradeLicenseNumber = String(body.tradeLicenseNumber ?? "");
  }
  if (body?.tradeLicenseDocument !== undefined) {
    patch.tradeLicenseDocument = String(body.tradeLicenseDocument ?? "");
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

export async function DELETE(_request: Request, context: Params) {
  const auth = await requireSession(["supplier"]);
  if (!auth.ok) return auth.response;

  if (supplierHasOutstandingCommission(auth.user.id)) {
    return NextResponse.json({ error: API_SUPPLIER_COMMISSION_SUSPENDED }, { status: 403 });
  }

  const { id } = await context.params;
  const company = getCompany(id);
  if (!company || company.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = checkRateLimit(`companydel:${auth.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many deletions. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const productIds = listProducts()
    .filter((p) => p.companyId === id)
    .map((p) => p.id);

  if (companyApprovedOrVerified(company) && productIds.length > 0) {
    return NextResponse.json(
      {
        error:
          "Remove all product listings for this verified company before you can remove the company.",
      },
      { status: 400 },
    );
  }

  for (const productId of productIds) {
    deleteCommentsForProduct(productId);
    deleteReviewsForProduct(productId);
    removeProductFromAllCarts(productId);
    deleteProduct(productId);
  }
  deleteAllReviewsForCompany(id);
  const ok = removeCompanyRecord(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
