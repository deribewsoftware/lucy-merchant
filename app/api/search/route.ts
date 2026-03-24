import { NextResponse } from "next/server";
import { getCompany } from "@/lib/db/catalog";
import type { SearchScope } from "@/lib/search/catalog-search";
import { searchCatalog } from "@/lib/search/catalog-search";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

function parseScope(v: string | null): SearchScope {
  if (
    v === "products" ||
    v === "companies" ||
    v === "categories" ||
    v === "all"
  ) {
    return v;
  }
  return "all";
}

export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = checkRateLimit(`searchapi:${ip}`, 150, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many search requests. Retry in ${rl.retryAfterSec}s` },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim();
  const scope = parseScope(searchParams.get("scope"));
  const categoryId = String(searchParams.get("category") ?? "").trim() || undefined;
  const limit = Math.min(
    80,
    Math.max(4, Number(searchParams.get("limit") ?? 24)),
  );

  if (!q) {
    return NextResponse.json({
      query: "",
      scope,
      products: [],
      companies: [],
      categories: [],
    });
  }

  const { products, companies, categories } = searchCatalog(q, scope, limit, {
    categoryId,
  });

  const productsOut = products.map((p) => {
    const co = getCompany(p.companyId);
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      ...(p.compareAtPrice != null && p.compareAtPrice > p.price
        ? { compareAtPrice: p.compareAtPrice }
        : {}),
      minOrderQuantity: p.minOrderQuantity,
      maxDeliveryQuantity: p.maxDeliveryQuantity,
      deliveryTime: p.deliveryTime,
      availableQuantity: p.availableQuantity,
      ...(p.itemsPerCarton != null && p.itemsPerCarton > 0
        ? { itemsPerCarton: p.itemsPerCarton }
        : {}),
      ...(p.itemsPerRim != null && p.itemsPerRim > 0
        ? { itemsPerRim: p.itemsPerRim }
        : {}),
      ...(p.itemsPerDozen != null && p.itemsPerDozen > 0
        ? { itemsPerDozen: p.itemsPerDozen }
        : {}),
      companyId: p.companyId,
      companyName: co?.name ?? "Supplier",
      categoryId: p.categoryId,
      isFeatured: !!p.isFeatured,
      imageUrl: p.imageUrl,
    };
  });

  const companiesOut = companies.map((c) => ({
    id: c.id,
    name: c.name,
    isVerified: c.isVerified,
    ratingAverage: c.ratingAverage,
    totalReviews: c.totalReviews,
    logo:
      c.logo && /^https?:\/\//i.test(c.logo.trim()) ? c.logo.trim() : undefined,
  }));

  const categoriesOut = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
  }));

  return NextResponse.json({
    query: q,
    scope,
    products: productsOut,
    companies: companiesOut,
    categories: categoriesOut,
  });
}
