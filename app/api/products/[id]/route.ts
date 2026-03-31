import { NextResponse } from "next/server";
import {
  deleteProduct,
  getCategories,
  getCompany,
  getProduct,
  getSystemConfig,
  updateProduct,
} from "@/lib/db/catalog";
import { deleteCommentsForProduct } from "@/lib/db/comments";
import { removeProductFromAllCarts } from "@/lib/db/commerce";
import { deleteReviewsForProduct } from "@/lib/db/product-reviews";
import { findUserById, updateUserPoints } from "@/lib/db/users";
import { normalizeCompareAtPrice } from "@/lib/domain/compare-at-price";
import { packagingFromPatch } from "@/lib/domain/packaging-from-body";
import { normalizeProductImageUrl } from "@/lib/server/product-image-url";
import { requireSession } from "@/lib/server/require-session";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { API_SUPPLIER_COMMISSION_SUSPENDED } from "@/lib/domain/commission-hold-copy";
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const product = getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const company = getCompany(product.companyId) ?? null;
  return NextResponse.json({ product, company });
}

export async function PATCH(request: Request, context: Params) {
  const auth = await requireSession(["supplier"]);
  if (!auth.ok) return auth.response;

  if (supplierHasOutstandingCommission(auth.user.id)) {
    return NextResponse.json({ error: API_SUPPLIER_COMMISSION_SUSPENDED }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = getProduct(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const company = getCompany(existing.companyId);
  if (!company || company.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!company.isVerified) {
    return NextResponse.json(
      { error: "Company must be verified to edit products" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = String(body.name ?? existing.name).trim();
  const description = String(body.description ?? existing.description).trim();
  const categoryId = String(body.categoryId ?? existing.categoryId).trim();
  if (!name || !description || !categoryId) {
    return NextResponse.json(
      { error: "name, description, and categoryId are required" },
      { status: 400 },
    );
  }

  if (!getCategories().some((c) => c.id === categoryId)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  const price = Number(body.price ?? existing.price);
  const availableQuantity = Number(
    body.availableQuantity ?? existing.availableQuantity,
  );
  const minOrderQuantity = Math.max(
    1,
    Number(body.minOrderQuantity ?? existing.minOrderQuantity) || 1,
  );
  let nextMaxDelivery: number | undefined = existing.maxDeliveryQuantity;
  let removeMaxDelivery = false;
  if ("maxDeliveryQuantity" in body) {
    const raw = (body as { maxDeliveryQuantity?: unknown }).maxDeliveryQuantity;
    if (raw === null || raw === "") {
      nextMaxDelivery = undefined;
      removeMaxDelivery = true;
    } else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 1) {
        return NextResponse.json(
          { error: "Invalid max delivery quantity" },
          { status: 400 },
        );
      }
      nextMaxDelivery = n;
    }
  }
  const deliveryTime = String(
    body.deliveryTime ?? existing.deliveryTime,
  ).trim();
  if (!deliveryTime) {
    return NextResponse.json(
      { error: "deliveryTime is required" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  let nextCompareAt: number | undefined;
  if ("compareAtPrice" in body) {
    const raw = (body as { compareAtPrice?: unknown }).compareAtPrice;
    if (raw === null || raw === "") {
      nextCompareAt = undefined;
    } else {
      nextCompareAt = normalizeCompareAtPrice(price, raw);
    }
  } else {
    nextCompareAt = existing.compareAtPrice;
    if (
      nextCompareAt != null &&
      (!Number.isFinite(nextCompareAt) || nextCompareAt <= price)
    ) {
      nextCompareAt = undefined;
    }
  }
  if (!Number.isFinite(availableQuantity) || availableQuantity < 0) {
    return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.map(String)
    : existing.tags;

  const imageUrl = normalizeProductImageUrl(
    String(
      body.imageUrl !== undefined ? body.imageUrl : (existing.imageUrl ?? ""),
    ),
  );

  const shipRaw = String(
    body.shipFromRegion !== undefined
      ? body.shipFromRegion
      : (existing.shipFromRegion ?? ""),
  )
    .trim()
    .slice(0, 256);
  const shipFromRegion = shipRaw || undefined;

  const cfg = getSystemConfig();
  const wasFeatured = Boolean(existing.isFeatured);
  let wantFeatured = wasFeatured;
  if (body.featured !== undefined && body.featured !== null) {
    wantFeatured = Boolean(body.featured);
  }

  const featuredCost =
    wantFeatured && !wasFeatured && cfg.featuredProductCost > 0
      ? cfg.featuredProductCost
      : 0;

  if (featuredCost > 0) {
    const user = findUserById(auth.user.id);
    const pts = user?.points ?? 0;
    if (pts < featuredCost) {
      return NextResponse.json(
        {
          error: `Insufficient points to enable featured listing (${featuredCost} required)`,
        },
        { status: 402 },
      );
    }
    updateUserPoints(auth.user.id, pts - featuredCost);
  }

  const packaging = packagingFromPatch(body as Record<string, unknown>, existing);

  const patch = {
    name,
    description,
    categoryId,
    tags,
    price,
    compareAtPrice: nextCompareAt,
    availableQuantity,
    minOrderQuantity,
    ...(removeMaxDelivery
      ? {}
      : nextMaxDelivery !== undefined
        ? { maxDeliveryQuantity: nextMaxDelivery }
        : {}),
    deliveryTime,
    ...packaging,
    ...(imageUrl ? { imageUrl } : { imageUrl: undefined }),
    isFeatured: wantFeatured,
    ...(shipFromRegion ? { shipFromRegion } : { shipFromRegion: undefined }),
  };

  const product = updateProduct(id, patch, {
    removeKeys: removeMaxDelivery ? ["maxDeliveryQuantity"] : undefined,
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, context: Params) {
  const auth = await requireSession(["supplier"]);
  if (!auth.ok) return auth.response;

  if (supplierHasOutstandingCommission(auth.user.id)) {
    return NextResponse.json({ error: API_SUPPLIER_COMMISSION_SUSPENDED }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = getProduct(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const company = getCompany(existing.companyId);
  if (!company || company.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const delRl = checkRateLimit(`proddel:${auth.user.id}`, 20, 60 * 60 * 1000);
  if (!delRl.ok) {
    return NextResponse.json(
      { error: `Too many deletions. Retry in ${delRl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  deleteCommentsForProduct(id);
  deleteReviewsForProduct(id);
  removeProductFromAllCarts(id);
  const ok = deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
