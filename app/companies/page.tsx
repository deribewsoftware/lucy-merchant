import Link from "next/link";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { listCompanies } from "@/lib/db/catalog";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function CompaniesDirectoryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = 12;

  const sorted = [...listCompanies()].sort((a, b) => {
    if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
    if (b.ratingAverage !== a.ratingAverage) {
      return b.ratingAverage - a.ratingAverage;
    }
    return a.name.localeCompare(b.name);
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const slice = sorted.slice(start, start + pageSize);

  const href = (p: number) =>
    p > 1 ? `/companies?page=${p}` : "/companies";

  return (
    <div className="container mx-auto max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>Suppliers</li>
        </ul>
      </div>

      <SectionHeader
        className="mt-4"
        eyebrow="B2B directory"
        title="Supplier companies"
        description="Verified partners appear first. Open a profile to see listings, ratings, and MOQs."
        icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />}
      />

      {total > 0 && (
        <p className="mt-4 text-sm text-base-content/60">
          Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}
        </p>
      )}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((c) => {
          const logoOk =
            c.logo && /^https?:\/\//i.test(c.logo.trim())
              ? c.logo.trim()
              : null;
          return (
            <li key={c.id}>
              <Link
                href={`/companies/${c.id}`}
                className="card h-full overflow-hidden border border-base-300 bg-base-100 shadow-md transition hover:border-primary/35 hover:shadow-lg"
              >
                {logoOk ? (
                  <figure className="relative aspect-[2/1] w-full bg-base-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoOk}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </figure>
                ) : null}
                <div className="card-body p-5">
                  <h2 className="card-title line-clamp-2 text-base">{c.name}</h2>
                  <p className="line-clamp-2 text-sm text-base-content/65">
                    {c.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.isVerified ? (
                      <span className="badge badge-success badge-sm">
                        Verified
                      </span>
                    ) : (
                      <span className="badge badge-warning badge-sm">
                        Pending
                      </span>
                    )}
                    <span className="badge badge-outline badge-sm">
                      {c.ratingAverage.toFixed(1)}★ · {c.totalReviews} reviews
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {total === 0 && (
        <p className="mt-10 text-center text-sm text-base-content/60">
          No companies registered yet.
        </p>
      )}

      <PaginationBar
        page={safePage}
        pageSize={pageSize}
        total={total}
        buildHref={href}
      />
    </div>
  );
}
