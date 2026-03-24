import { getCategories, listCompanies, listProducts } from "@/lib/db/catalog";
import type { Category, Company, Product } from "@/lib/domain/types";

export type SearchScope = "all" | "products" | "companies" | "categories";

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Direct substring match (PDF: fuzzy tolerance — we add subsequence as light typo help). */
export function matchesQuery(haystack: string, q: string): boolean {
  const h = normalize(haystack);
  const needle = normalize(q);
  if (!needle) return false;
  if (h.includes(needle)) return true;
  let i = 0;
  for (const ch of h) {
    if (ch === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return false;
}

function featuredThenOrders(a: Product, b: Product): number {
  const f = Number(!!b.isFeatured) - Number(!!a.isFeatured);
  if (f !== 0) return f;
  return b.totalOrdersCount - a.totalOrdersCount;
}

export function searchProducts(q: string, limit: number): Product[] {
  if (!q.trim()) return [];
  const all = listProducts();
  return all
    .filter(
      (p) =>
        matchesQuery(p.name, q) ||
        matchesQuery(p.description, q) ||
        p.tags.some((t) => matchesQuery(t, q)),
    )
    .sort(featuredThenOrders)
    .slice(0, limit);
}

export function searchCompanies(q: string, limit: number): Company[] {
  if (!q.trim()) return [];
  const all = listCompanies();
  return all
    .filter(
      (c) => matchesQuery(c.name, q) || matchesQuery(c.description, q),
    )
    .slice(0, limit);
}

export function searchCategories(q: string, limit: number): Category[] {
  if (!q.trim()) return [];
  const all = getCategories();
  return all.filter((c) => matchesQuery(c.name, q)).slice(0, limit);
}

function filterProductsByCategory(
  products: Product[],
  categoryId: string | undefined,
): Product[] {
  if (!categoryId?.trim()) return products;
  return products.filter((p) => p.categoryId === categoryId);
}

export function searchCatalog(
  q: string,
  scope: SearchScope,
  limitPerBucket: number,
  options?: { categoryId?: string },
): {
  products: Product[];
  companies: Company[];
  categories: Category[];
} {
  const trimmed = q.trim();
  const cat = options?.categoryId?.trim() || undefined;
  if (!trimmed) {
    return { products: [], companies: [], categories: [] };
  }
  if (scope === "products") {
    return {
      products: filterProductsByCategory(
        searchProducts(trimmed, limitPerBucket),
        cat,
      ),
      companies: [],
      categories: [],
    };
  }
  if (scope === "companies") {
    return {
      products: [],
      companies: searchCompanies(trimmed, limitPerBucket),
      categories: [],
    };
  }
  if (scope === "categories") {
    return {
      products: [],
      companies: [],
      categories: searchCategories(trimmed, limitPerBucket),
    };
  }
  return {
    products: filterProductsByCategory(
      searchProducts(trimmed, limitPerBucket),
      cat,
    ),
    companies: searchCompanies(trimmed, limitPerBucket),
    categories: searchCategories(trimmed, Math.min(8, limitPerBucket)),
  };
}
