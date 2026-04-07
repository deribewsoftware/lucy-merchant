import { NextResponse } from "next/server";
import { getCategories, getCompany } from "@/lib/db/catalog";
import type { SearchScope } from "@/lib/search/catalog-search";
import {
  isSearchNoMatchForScope,
  searchCatalog,
} from "@/lib/search/catalog-search";
import { SEARCH_QUERY_SYNTAX } from "@/lib/search/search-query-syntax";
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
    500,
    Math.max(4, Number(searchParams.get("limit") ?? 80)),
  );

  const cats = getCategories();
  const categoryName = (id: string) =>
    cats.find((c) => c.id === id)?.name ?? "";

  if (!q && !categoryId?.trim()) {
    return NextResponse.json({
      query: "",
      scope,
      noMatch: false,
      products: [],
      companies: [],
      categories: [],
      recommendationTags: [],
      recommendedProducts: [],
      querySyntax: SEARCH_QUERY_SYNTAX,
    });
  }

  const {
    products,
    companies,
    categories,
    recommendationTags,
    recommendedProducts,
  } = searchCatalog(q, scope, limit, {
    categoryId,
  });

  const noMatch = Boolean(
    q.trim() &&
      isSearchNoMatchForScope(scope, products, companies, categories),
  );

  function productJson(p: (typeof products)[number]) {
    const co = getCompany(p.companyId);
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      tags: p.tags ?? [],
      categoryName: categoryName(p.categoryId),
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
  }

  const productsOut = products.map(productJson);
  const recommendedProductsOut = recommendedProducts.map(productJson);

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
    noMatch,
    products: productsOut,
    companies: companiesOut,
    categories: categoriesOut,
    recommendationTags,
    recommendedProducts: recommendedProductsOut,
    querySyntax: SEARCH_QUERY_SYNTAX,
  });
}
