import { NextResponse } from "next/server";
import {
  createProduct,
  getCategories,
  getCompany,
  getSystemConfig,
  listProducts,
} from "@/lib/db/catalog";
import { findUserById, updateUserPoints } from "@/lib/db/users";
import { normalizeCompareAtPrice } from "@/lib/domain/compare-at-price";
import { packagingForCreate } from "@/lib/domain/packaging-from-body";
import { requireSession } from "@/lib/server/require-session";
import { API_SUPPLIER_COMMISSION_SUSPENDED } from "@/lib/domain/commission-hold-copy";
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") ?? "recent";
  let products = [...listProducts()];
  const feat = (a: (typeof products)[0], b: (typeof products)[0]) =>
    Number(!!b.isFeatured) - Number(!!a.isFeatured);
  if (sort === "orders") {
    products.sort((a, b) => feat(a, b) || b.totalOrdersCount - a.totalOrdersCount);
  } else if (sort === "rating") {
    products.sort((a, b) => feat(a, b) || b.averageRating - a.averageRating);
  } else if (sort === "price_asc") {
    products.sort((a, b) => feat(a, b) || a.price - b.price);
  } else if (sort === "price_desc") {
    products.sort((a, b) => feat(a, b) || b.price - a.price);
  } else {
    products.sort(
      (a, b) => feat(a, b) || (a.createdAt < b.createdAt ? 1 : -1),
    );
  }
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const auth = await requireSession(["supplier"]);
  if (!auth.ok) return auth.response;

  if (supplierHasOutstandingCommission(auth.user.id)) {
    return NextResponse.json({ error: API_SUPPLIER_COMMISSION_SUSPENDED }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const companyId = String(body?.companyId ?? "");
  const company = getCompany(companyId);
  if (!company || company.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "Invalid company" }, { status: 400 });
  }
  if (!company.isVerified) {
    return NextResponse.json(
      { error: "Company must be verified before posting products" },
      { status: 403 },
    );
  }

  const categoryIdPost = String(body?.categoryId ?? "");
  if (!getCategories().some((c) => c.id === categoryIdPost)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  const cfg = getSystemConfig();
  const user = findUserById(auth.user.id);
  const wantFeatured = Boolean(body?.featured);
  const featuredCost =
    wantFeatured && cfg.featuredProductCost > 0 ? cfg.featuredProductCost : 0;

  let pts = user?.points ?? 0;
  if (!cfg.freePostingEnabled) {
    const cost = cfg.postProductPoints;
    if (pts < cost) {
      return NextResponse.json(
        { error: "Insufficient points to post a product" },
        { status: 402 },
      );
    }
    pts -= cost;
  }
  if (featuredCost > 0) {
    if (pts < featuredCost) {
      return NextResponse.json(
        {
          error: `Insufficient points for featured listing (${featuredCost} required after posting cost)`,
        },
        { status: 402 },
      );
    }
    pts -= featuredCost;
  }
  if (!cfg.freePostingEnabled || featuredCost > 0) {
    updateUserPoints(auth.user.id, pts);
  }

  const imageUrlRaw = String(body?.imageUrl ?? "").trim();
  const imageUrl =
    imageUrlRaw && /^https?:\/\//i.test(imageUrlRaw) ? imageUrlRaw : undefined;

  const shipRaw = String(body?.shipFromRegion ?? "").trim().slice(0, 80);
  const shipFromRegion = shipRaw || undefined;

  const unitPrice = Number(body?.price) || 0;
  const compareAt = normalizeCompareAtPrice(unitPrice, body?.compareAtPrice);

  const pack = packagingForCreate(body);

  const product = createProduct({
    companyId,
    name: String(body?.name ?? ""),
    description: String(body?.description ?? ""),
    categoryId: categoryIdPost,
    tags: Array.isArray(body?.tags) ? body.tags.map(String) : [],
    price: unitPrice,
    ...(compareAt != null ? { compareAtPrice: compareAt } : {}),
    availableQuantity: Number(body?.availableQuantity) || 0,
    minOrderQuantity: Math.max(1, Number(body?.minOrderQuantity) || 1),
    maxDeliveryQuantity: Number(body?.maxDeliveryQuantity) || 0,
    deliveryTime: String(body?.deliveryTime ?? ""),
    totalOrdersCount: 0,
    averageRating: 0,
    ...(imageUrl ? { imageUrl } : {}),
    ...(wantFeatured ? { isFeatured: true } : {}),
    ...(shipFromRegion ? { shipFromRegion } : {}),
    ...pack,
  });

  return NextResponse.json({ product });
}
