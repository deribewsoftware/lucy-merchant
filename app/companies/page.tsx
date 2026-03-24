import Link from "next/link"
import { Building2, Star, CheckCircle2, Clock, ArrowRight, Sparkles } from "lucide-react"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { listCompanies } from "@/lib/db/catalog"

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function CompaniesDirectoryPage({ searchParams }: Props) {
  const sp = await searchParams
  const pageRaw = parseInt(sp.page ?? "1", 10)
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1
  const pageSize = 12

  const sorted = [...listCompanies()].sort((a, b) => {
    if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1
    if (b.ratingAverage !== a.ratingAverage) {
      return b.ratingAverage - a.ratingAverage
    }
    return a.name.localeCompare(b.name)
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const slice = sorted.slice(start, start + pageSize)

  const href = (p: number) => (p > 1 ? `/companies?page=${p}` : "/companies")

  return (
    <div className="container mx-auto max-w-6xl flex-1 px-4 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">Suppliers</span>
      </nav>

      {/* Header */}
      <header className="relative mt-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/5 to-accent/5 p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/20">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              B2B Directory
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Supplier Companies
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Verified partners appear first. Open a profile to see listings, ratings, and minimum order quantities.
            </p>
          </div>
        </div>
        
        {total > 0 && (
          <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Companies</p>
              <p className="mt-1 text-xl font-bold text-foreground">{total}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Verified</p>
              <p className="mt-1 text-xl font-bold text-accent">
                {sorted.filter(c => c.isVerified).length}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm sm:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Showing</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {start + 1}-{Math.min(start + pageSize, total)}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Companies Grid */}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((c, index) => {
          const logoOk = c.logo && /^https?:\/\//i.test(c.logo.trim()) ? c.logo.trim() : null
          return (
            <li 
              key={c.id}
              className="animate-in fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link
                href={`/companies/${c.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                {logoOk && (
                  <figure className="relative aspect-[2/1] w-full overflow-hidden bg-muted">
                    <img
                      src={logoOk}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </figure>
                )}
                
                <div className="relative flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-lg font-semibold text-foreground">
                      {c.name}
                    </h2>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {c.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {c.ratingAverage.toFixed(1)}
                      <span className="text-muted-foreground">
                        ({c.totalReviews})
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      {total === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
            <Building2 className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground">No companies yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            No companies have registered on the platform yet.
          </p>
        </div>
      )}

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={total}
        buildHref={href}
      />
    </div>
  )
}
