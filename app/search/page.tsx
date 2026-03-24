import type { ReactNode } from "react";
import Link from "next/link";
import {
  HiOutlineCube,
  HiOutlineRectangleStack,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";
import { ProductOrderSpecs } from "@/components/product-order-specs";
import { ProductUnitPrice } from "@/components/product-unit-price";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getCategories, getCompany } from "@/lib/db/catalog";
import type { SearchScope } from "@/lib/search/catalog-search";
import { searchCatalog } from "@/lib/search/catalog-search";

type Props = {
  searchParams: Promise<{
    q?: string;
    scope?: string;
    category?: string;
    page?: string;
    /** Company page when scope is "all" */
    cpage?: string;
    /** Category hits when scope is "all" */
    catpage?: string;
  }>;
};

function parseScope(v: string | undefined): SearchScope {
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

function searchCatParam(
  categoryId: string,
  categories: { id: string }[],
): string | undefined {
  const id = categoryId.trim();
  if (!id) return undefined;
  return categories.some((c) => c.id === id) ? id : undefined;
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const scope = parseScope(sp.scope);
  const categoriesAll = getCategories();
  const filterCategoryId = searchCatParam(sp.category ?? "", categoriesAll);
  const filterCategory = filterCategoryId
    ? categoriesAll.find((c) => c.id === filterCategoryId)
    : undefined;

  const pageRaw = parseInt(sp.page ?? "1", 10);
  const pageParam = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const cpageRaw = parseInt(sp.cpage ?? "1", 10);
  const cpageParam = Number.isFinite(cpageRaw) && cpageRaw >= 1 ? cpageRaw : 1;
  const catpageRaw = parseInt(sp.catpage ?? "1", 10);
  const catpageParam =
    Number.isFinite(catpageRaw) && catpageRaw >= 1 ? catpageRaw : 1;

  const productPageSize = 12;
  const companyPageSize = 10;
  const categoryPageSize = 24;

  const { products, companies, categories } = searchCatalog(q, scope, 500, {
    categoryId: filterCategoryId,
  });

  const useProductPaging = scope === "all" || scope === "products";
  const productTotal = products.length;
  const productPages = Math.max(1, Math.ceil(productTotal / productPageSize));
  const productPageSafe = useProductPaging
    ? Math.min(pageParam, productPages)
    : 1;
  const pStart = useProductPaging
    ? (productPageSafe - 1) * productPageSize
    : 0;
  const productsPage = useProductPaging
    ? products.slice(pStart, pStart + productPageSize)
    : [];

  const useCompanyPaging = scope === "all" || scope === "companies";
  const companyTotal = companies.length;
  const companyPages = Math.max(1, Math.ceil(companyTotal / companyPageSize));
  const companyPageNum =
    scope === "all" ? cpageParam : scope === "companies" ? pageParam : 1;
  const companyPageSafe = useCompanyPaging
    ? Math.min(companyPageNum, companyPages)
    : 1;
  const cStart = useCompanyPaging
    ? (companyPageSafe - 1) * companyPageSize
    : 0;
  const companiesPage = useCompanyPaging
    ? companies.slice(cStart, cStart + companyPageSize)
    : [];

  const useCategoryPaging = scope === "all" || scope === "categories";
  const categoryTotal = categories.length;
  const categoryPages = Math.max(
    1,
    Math.ceil(categoryTotal / categoryPageSize),
  );
  const categoryPageNum =
    scope === "all" ? catpageParam : scope === "categories" ? pageParam : 1;
  const categoryPageSafe = useCategoryPaging
    ? Math.min(categoryPageNum, categoryPages)
    : 1;
  const catStart = useCategoryPaging
    ? (categoryPageSafe - 1) * categoryPageSize
    : 0;
  const categoriesPage = useCategoryPaging
    ? categories.slice(catStart, catStart + categoryPageSize)
    : [];

  function searchProductsHref(p: number) {
    const u = new URLSearchParams();
    u.set("q", q);
    u.set("scope", scope);
    if (filterCategoryId) u.set("category", filterCategoryId);
    if (scope === "all" && companyPageSafe > 1) {
      u.set("cpage", String(companyPageSafe));
    }
    if (scope === "all" && categoryPageSafe > 1) {
      u.set("catpage", String(categoryPageSafe));
    }
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return qs ? `/search?${qs}` : "/search";
  }

  function searchCompaniesHref(p: number) {
    const u = new URLSearchParams();
    u.set("q", q);
    u.set("scope", scope);
    if (filterCategoryId) u.set("category", filterCategoryId);
    if (scope === "all") {
      if (productPageSafe > 1) u.set("page", String(productPageSafe));
      if (categoryPageSafe > 1) u.set("catpage", String(categoryPageSafe));
      if (p > 1) u.set("cpage", String(p));
    } else if (p > 1) {
      u.set("page", String(p));
    }
    const qs = u.toString();
    return qs ? `/search?${qs}` : "/search";
  }

  function searchCategoriesHref(p: number) {
    const u = new URLSearchParams();
    u.set("q", q);
    u.set("scope", scope);
    if (filterCategoryId) u.set("category", filterCategoryId);
    if (scope === "all") {
      if (productPageSafe > 1) u.set("page", String(productPageSafe));
      if (companyPageSafe > 1) u.set("cpage", String(companyPageSafe));
      if (p > 1) u.set("catpage", String(p));
    } else if (scope === "categories" && p > 1) {
      u.set("page", String(p));
    }
    const qs = u.toString();
    return qs ? `/search?${qs}` : "/search";
  }

  const tabs: { id: SearchScope; label: string; icon: ReactNode }[] = [
    { id: "all", label: "All", icon: <HiOutlineRectangleStack className="h-4 w-4" /> },
    { id: "products", label: "Products", icon: <HiOutlineCube className="h-4 w-4" /> },
    {
      id: "companies",
      label: "Companies",
      icon: <HiOutlineBuildingOffice2 className="h-4 w-4" />,
    },
    {
      id: "categories",
      label: "Categories",
      icon: <HiOutlineRectangleStack className="h-4 w-4" />,
    },
  ];

  const catQ = filterCategoryId
    ? `&category=${encodeURIComponent(filterCategoryId)}`
    : "";

  return (
    <div className="container mx-auto max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>Search</li>
        </ul>
      </div>

      <h1 className="font-display mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        Search results
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-base-content/70">
        Global search across products, companies, and categories — with light
        typo tolerance and the same scopes as the header search.
      </p>

      <form
        action="/search"
        method="get"
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="scope" value={scope} />
        {filterCategoryId ? (
          <input type="hidden" name="category" value={filterCategoryId} />
        ) : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products, companies, categories…"
          className="input input-bordered w-full flex-1 bg-base-100"
        />
        <button type="submit" className="btn btn-primary shrink-0">
          Search
        </button>
      </form>

      {filterCategory && (
        <p className="mt-3 text-sm text-base-content/70">
          Product results limited to{" "}
          <strong className="text-accent">{filterCategory.name}</strong>.{" "}
          <Link
            href={`/search?q=${encodeURIComponent(q)}&scope=${scope}`}
            className="link link-primary"
          >
            Clear category filter
          </Link>
        </p>
      )}

      <div role="tablist" className="tabs tabs-boxed mt-6 flex-wrap gap-1 bg-base-200 p-1">
        {tabs.map((t) => {
          const active = scope === t.id;
          const href = `/search?q=${encodeURIComponent(q)}&scope=${t.id}${catQ}`;
          return (
            <Link
              key={t.id}
              href={href}
              role="tab"
              className={`tab gap-2 ${active ? "tab-active" : ""}`}
            >
              {t.icon}
              {t.label}
            </Link>
          );
        })}
      </div>

      {!q && (
        <p className="mt-8 text-sm text-base-content/60">
          Enter a query to search the marketplace. Use the header search for
          instant suggestions and filters.
        </p>
      )}

      {q && (
        <div className="mt-8 space-y-10">
          {(scope === "all" || scope === "products") && products.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <HiOutlineCube className="h-5 w-5 text-primary" />
                Products ({products.length})
              </h2>
              {useProductPaging && (
                <p className="mt-2 text-sm text-base-content/60">
                  Showing {pStart + 1}–
                  {Math.min(pStart + productPageSize, productTotal)} of{" "}
                  {productTotal}
                </p>
              )}
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {productsPage.map((p) => {
                  const co = getCompany(p.companyId);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.id}`}
                        className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition hover:border-primary/35"
                      >
                        {p.imageUrl ? (
                          <figure className="relative aspect-[16/10] bg-base-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            {p.isFeatured ? (
                              <span className="badge badge-warning absolute end-2 top-2 text-[10px] uppercase">
                                Featured
                              </span>
                            ) : null}
                          </figure>
                        ) : null}
                        <div className="card-body p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{p.name}</span>
                            {p.isFeatured && !p.imageUrl ? (
                              <span className="badge badge-warning badge-sm uppercase">
                                Featured
                              </span>
                            ) : null}
                          </div>
                          <span className="text-xs text-base-content/55">
                            {co?.name ?? "Supplier"}
                          </span>
                          <div className="mt-1 space-y-1 text-sm">
                            <ProductUnitPrice
                              price={p.price}
                              compareAtPrice={p.compareAtPrice}
                              saleClassName="font-bold text-primary"
                            />
                            <ProductOrderSpecs
                              size="sm"
                              product={{
                                minOrderQuantity: p.minOrderQuantity,
                                maxDeliveryQuantity: p.maxDeliveryQuantity,
                                deliveryTime: p.deliveryTime,
                                availableQuantity: p.availableQuantity,
                                itemsPerCarton: p.itemsPerCarton,
                                itemsPerRim: p.itemsPerRim,
                                itemsPerDozen: p.itemsPerDozen,
                              }}
                            />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <PaginationBar
                page={productPageSafe}
                pageSize={productPageSize}
                total={productTotal}
                buildHref={searchProductsHref}
              />
            </section>
          )}

          {(scope === "all" || scope === "companies") && companies.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <HiOutlineBuildingOffice2 className="h-5 w-5 text-secondary" />
                Companies ({companies.length})
              </h2>
              {useCompanyPaging && (
                <p className="mt-2 text-sm text-base-content/60">
                  Showing {cStart + 1}–
                  {Math.min(cStart + companyPageSize, companyTotal)} of{" "}
                  {companyTotal}
                </p>
              )}
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {companiesPage.map((c) => {
                  const logoOk =
                    c.logo && /^https?:\/\//i.test(c.logo.trim())
                      ? c.logo.trim()
                      : null;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/companies/${c.id}`}
                        className="card border border-base-300 bg-base-100 shadow-sm transition hover:border-secondary/40"
                      >
                        <div className="card-body flex flex-row items-center gap-4 p-4">
                          {logoOk ? (
                            <figure className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={logoOk}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </figure>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold">{c.name}</span>
                            <p className="text-xs text-base-content/55">
                              {c.isVerified ? "Verified" : "Pending"} ·{" "}
                              {c.ratingAverage.toFixed(1)}★
                              {c.totalReviews > 0
                                ? ` · ${c.totalReviews} review${c.totalReviews === 1 ? "" : "s"}`
                                : ""}
                            </p>
                          </div>
                          <span className="btn btn-ghost btn-sm shrink-0">
                            View
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <PaginationBar
                page={companyPageSafe}
                pageSize={companyPageSize}
                total={companyTotal}
                buildHref={searchCompaniesHref}
              />
            </section>
          )}

          {(scope === "all" || scope === "categories") &&
            categories.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <HiOutlineRectangleStack className="h-5 w-5 text-accent" />
                  Categories ({categories.length})
                </h2>
                {useCategoryPaging && (
                  <p className="mt-2 text-sm text-base-content/60">
                    Showing {catStart + 1}–
                    {Math.min(catStart + categoryPageSize, categoryTotal)} of{" "}
                    {categoryTotal}
                  </p>
                )}
                <ul className="mt-4 flex flex-wrap gap-2">
                  {categoriesPage.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/browse?category=${c.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <PaginationBar
                  page={categoryPageSafe}
                  pageSize={categoryPageSize}
                  total={categoryTotal}
                  buildHref={searchCategoriesHref}
                />
              </section>
            )}

          {q &&
            products.length === 0 &&
            companies.length === 0 &&
            categories.length === 0 && (
              <p className="text-sm text-base-content/65">
                No matches for &quot;{q}&quot; in this scope. Try another
                keyword or switch the filter tab.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
