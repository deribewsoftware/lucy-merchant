import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Package,
  Layers,
  Building2,
  Search,
  ArrowRight,
  Star,
  Sparkles,
  Tags,
  XCircle,
} from "lucide-react"
import { ProductOrderSpecs } from "@/components/product-order-specs"
import { ProductUnitPrice } from "@/components/product-unit-price"
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar"
import { getCategories, getCompany } from "@/lib/db/catalog"
import type { SearchScope } from "@/lib/search/catalog-search"
import {
  isSearchNoMatchForScope,
  searchCatalog,
} from "@/lib/search/catalog-search"
import { SEARCH_QUERY_SYNTAX } from "@/lib/search/search-query-syntax"

type Props = {
  searchParams: Promise<{
    q?: string
    scope?: string
    category?: string
    page?: string
    cpage?: string
  }>
}

function parseScope(v: string | undefined): SearchScope {
  if (v === "products" || v === "companies" || v === "categories" || v === "all") {
    return v
  }
  return "all"
}

function searchCatParam(categoryId: string, categories: { id: string }[]): string | undefined {
  const id = categoryId.trim()
  if (!id) return undefined
  return categories.some((c) => c.id === id) ? id : undefined
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp.q ?? "").trim()
  const scope = parseScope(sp.scope)
  const categoriesAll = getCategories()
  const filterCategoryId = searchCatParam(sp.category ?? "", categoriesAll)
  const filterCategory = filterCategoryId
    ? categoriesAll.find((c) => c.id === filterCategoryId)
    : undefined

  const pageRaw = parseInt(sp.page ?? "1", 10)
  const pageParam = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1
  const cpageRaw = parseInt(sp.cpage ?? "1", 10)
  const cpageParam = Number.isFinite(cpageRaw) && cpageRaw >= 1 ? cpageRaw : 1

  const productPageSize = 12
  const companyPageSize = 10

  const searchResultCap = 5000
  const {
    products,
    companies,
    categories,
    recommendationTags,
    recommendedProducts,
  } = searchCatalog(q, scope, searchResultCap, {
    categoryId: filterCategoryId,
  })

  const showSearchNoMatchBanner = Boolean(
    q.trim() &&
      isSearchNoMatchForScope(scope, products, companies, categories),
  )

  const categoryNameById = (id: string) =>
    categoriesAll.find((c) => c.id === id)?.name

  const useProductPaging = scope === "all" || scope === "products"
  const productTotal = products.length
  const productPages = Math.max(1, Math.ceil(productTotal / productPageSize))
  const productPageSafe = useProductPaging ? Math.min(pageParam, productPages) : 1
  const pStart = useProductPaging ? (productPageSafe - 1) * productPageSize : 0
  const productsPage = useProductPaging ? products.slice(pStart, pStart + productPageSize) : []

  const useCompanyPaging = scope === "all" || scope === "companies"
  const companyTotal = companies.length
  const companyPages = Math.max(1, Math.ceil(companyTotal / companyPageSize))
  const companyPageNum = scope === "all" ? cpageParam : scope === "companies" ? pageParam : 1
  const companyPageSafe = useCompanyPaging ? Math.min(companyPageNum, companyPages) : 1
  const cStart = useCompanyPaging ? (companyPageSafe - 1) * companyPageSize : 0
  const companiesPage = useCompanyPaging ? companies.slice(cStart, cStart + companyPageSize) : []

  function searchProductsHref(p: number) {
    const u = new URLSearchParams()
    u.set("q", q)
    u.set("scope", scope)
    if (filterCategoryId) u.set("category", filterCategoryId)
    if (scope === "all" && companyPageSafe > 1) u.set("cpage", String(companyPageSafe))
    if (p > 1) u.set("page", String(p))
    const qs = u.toString()
    return qs ? `/search?${qs}` : "/search"
  }

  function searchCompaniesHref(p: number) {
    const u = new URLSearchParams()
    u.set("q", q)
    u.set("scope", scope)
    if (filterCategoryId) u.set("category", filterCategoryId)
    if (scope === "all") {
      if (productPageSafe > 1) u.set("page", String(productPageSafe))
      if (p > 1) u.set("cpage", String(p))
    } else if (p > 1) {
      u.set("page", String(p))
    }
    const qs = u.toString()
    return qs ? `/search?${qs}` : "/search"
  }

  const tabs: { id: SearchScope; label: string; icon: ReactNode }[] = [
    { id: "all", label: "All", icon: <Layers className="h-4 w-4" /> },
    { id: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
    { id: "companies", label: "Companies", icon: <Building2 className="h-4 w-4" /> },
    { id: "categories", label: "Categories", icon: <Tags className="h-4 w-4" /> },
  ]

  const catQ = filterCategoryId ? `&category=${encodeURIComponent(filterCategoryId)}` : ""

  return (
    <div className="lm-page-wide">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">Search</span>
      </nav>

      {/* Header */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Search Results
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filterCategory ? (
                <>
                  Category:{" "}
                  <span className="font-medium text-foreground">
                    {filterCategory.name}
                  </span>
                  . Add a keyword to narrow results, or{" "}
                  <Link
                    href={`/browse?category=${encodeURIComponent(filterCategory.id)}`}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    browse this aisle
                  </Link>{" "}
                  with filters.
                </>
              ) : (
                <>Search across products, companies, and categories</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <form
        action="/search"
        method="get"
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="scope" value={scope} />
        {filterCategoryId && <input type="hidden" name="category" value={filterCategoryId} />}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products, companies, categories..."
            className="h-12 w-full rounded-xl border border-border/50 bg-card pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
        >
          Search
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p>
          Advanced: use <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans text-[0.7rem]">&quot;phrase&quot;</kbd> for exact text,{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans text-[0.7rem]">OR</kbd> or{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans text-[0.7rem]">|</kbd> between alternatives; several unquoted words all must match.
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground/90">
          {SEARCH_QUERY_SYNTAX}
        </p>
      </div>

      {/* Category Filter Notice */}
      {filterCategory && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Filtered by category:</span>
          <span className="font-medium text-primary">{filterCategory.name}</span>
          <Link
            href={`/search?q=${encodeURIComponent(q)}&scope=${scope}`}
            className="ml-auto inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <XCircle className="h-4 w-4" />
            Clear
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 rounded-xl bg-muted/50 p-1.5">
        {tabs.map((t) => {
          const active = scope === t.id
          const href = `/search?q=${encodeURIComponent(q)}&scope=${t.id}${catQ}`
          return (
            <Link
              key={t.id}
              href={href}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* No Query State (no category aisle either) */}
      {!q && !filterCategory && (
        <div className="mt-12 flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
            <Search className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground">Start searching</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Enter a keyword above, or pick a category in the search bar filters to see products in that category. You can also{" "}
            <Link href="/browse" className="text-primary underline-offset-2 hover:underline">
              browse the full catalog
            </Link>
            .
          </p>
        </div>
      )}

      {/* Results */}
      {(q || filterCategory) && (
        <div className="mt-8 space-y-10">
          {/* Products Section */}
          {(scope === "all" || scope === "products") && products.length > 0 && (
            <section>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Products ({products.length})
                  </h2>
                  {useProductPaging && (
                    <PaginationSummary
                      page={productPageSafe}
                      pageSize={productPageSize}
                      total={productTotal}
                      className="text-sm text-muted-foreground"
                    />
                  )}
                </div>
              </div>
              
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productsPage.map((p) => {
                  const co = getCompany(p.companyId)
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.id}`}
                        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                      >
                        {p.imageUrl && (
                          <figure className="relative aspect-[16/10] overflow-hidden bg-muted">
                            <Image
                              src={p.imageUrl}
                              alt=""
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 100vw, 33vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {p.isFeatured && (
                              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white">
                                <Sparkles className="h-3 w-3" />
                                Featured
                              </span>
                            )}
                          </figure>
                        )}
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-foreground">{p.name}</span>
                            {p.isFeatured && !p.imageUrl && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                                <Sparkles className="h-3 w-3" />
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="mt-1 text-xs text-muted-foreground">
                            {co?.name ?? "Supplier"}
                            {categoryNameById(p.categoryId) ? (
                              <>
                                {" "}
                                ·{" "}
                                <span className="text-foreground/80">
                                  {categoryNameById(p.categoryId)}
                                </span>
                              </>
                            ) : null}
                          </span>
                          <div className="mt-3 space-y-2 text-sm">
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
                  )
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

          {q.trim() &&
            (scope === "all" || scope === "products") &&
            (recommendationTags.length > 0 || recommendedProducts.length > 0) && (
            <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Best recommendations
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      From tags shared by your top matches — refine with a tag or explore related SKUs.
                    </p>
                  </div>
                </div>
              </div>
              {recommendationTags.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Popular tags in results
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {recommendationTags.map(({ tag, count }) => (
                      <li key={tag}>
                        <Link
                          href={`/search?q=${encodeURIComponent(tag)}&scope=products${filterCategoryId ? `&category=${encodeURIComponent(filterCategoryId)}` : ""}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Tags className="h-3.5 w-3.5 text-primary" />
                          {tag}
                          <span className="text-xs text-muted-foreground">×{count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recommendedProducts.length > 0 && (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {recommendedProducts.map((p) => {
                    const co = getCompany(p.companyId)
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/products/${p.id}`}
                          className="flex gap-3 rounded-xl border border-border/60 bg-card/80 p-3 text-sm shadow-sm transition-all hover:border-primary/30 hover:bg-card"
                        >
                          {p.imageUrl ? (
                            <figure className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                              <Image
                                src={p.imageUrl}
                                alt=""
                                width={64}
                                height={64}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            </figure>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-medium text-foreground">{p.name}</span>
                            {p.tags.length > 0 && (
                              <span className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {p.tags.slice(0, 3).join(" · ")}
                              </span>
                            )}
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {co?.name ?? "Supplier"}
                            </span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {/* Companies Section */}
          {(scope === "all" || scope === "companies") && companies.length > 0 && (
            <section>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Companies ({companies.length})
                  </h2>
                  {useCompanyPaging && (
                    <PaginationSummary
                      page={companyPageSafe}
                      pageSize={companyPageSize}
                      total={companyTotal}
                      className="text-sm text-muted-foreground"
                    />
                  )}
                </div>
              </div>
              
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {companiesPage.map((c) => {
                  const logoOk = c.logo && /^https?:\/\//i.test(c.logo.trim()) ? c.logo.trim() : null
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/companies/${c.id}`}
                        className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
                      >
                        {logoOk ? (
                          <figure className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            <Image
                              src={logoOk}
                              alt=""
                              width={56}
                              height={56}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          </figure>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-foreground">{c.name}</span>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                              c.isVerified ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                            }`}>
                              {c.isVerified ? "Verified" : "Pending"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              {c.ratingAverage.toFixed(1)}
                            </span>
                            {c.totalReviews > 0 && (
                              <span>{c.totalReviews} review{c.totalReviews === 1 ? "" : "s"}</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  )
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

          {/* Categories Section */}
          {(scope === "all" || scope === "categories") && categories.length > 0 && (
            <section>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                  <Layers className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Categories ({categories.length})
                  </h2>
                </div>
              </div>
              
              <ul className="mt-5 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/browse?category=${c.id}`}
                      className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Zero rows for this query (keyword and/or category filter) */}
          {q &&
            products.length === 0 &&
            companies.length === 0 &&
            categories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">No matches</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {showSearchNoMatchBanner ? (
                  <>
                    Nothing matched &quot;{q}&quot; for this tab and filters. Try other
                    words, switch scope, or{" "}
                    <Link
                      href="/browse"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      browse categories
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    No listings matched your filters. Try another keyword or switch the
                    filter tab.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
