import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { AdminCompanyVerify } from "@/components/admin-company-verify";
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar";
import { listCompanies } from "@/lib/db/catalog";
import { requireStaffPagePermission } from "@/lib/server/require-staff-page";
import { clampPage, pageStartIndex } from "@/lib/utils/pagination";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 10;

export default async function AdminCompaniesPage({ searchParams }: Props) {
  await requireStaffPagePermission("companies:verify", "/admin/companies");

  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const allPending = listCompanies().filter((c) => !c.isVerified);
  const total = allPending.length;
  const safePage = clampPage(page, total, PAGE_SIZE);
  const start = pageStartIndex(safePage, total, PAGE_SIZE);
  const pending = allPending.slice(start, start + PAGE_SIZE);

  const href = (p: number) =>
    p > 1 ? `/admin/companies?page=${p}` : "/admin/companies";

  return (
    <div>
      <header className="mb-2 flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <HiOutlineBuildingOffice2 className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Company verification
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60">
              Approve supplier organizations before they can list products on the
              marketplace. {total} pending
              {total === 1 ? "" : "s"} in queue.
            </p>
          </div>
        </div>
      </header>

      {total > 0 && (
        <PaginationSummary
          page={safePage}
          pageSize={PAGE_SIZE}
          total={total}
          className="mb-4 text-base-content/60"
        />
      )}

      <AdminCompanyVerify companies={pending} />

      <PaginationBar
        page={safePage}
        pageSize={PAGE_SIZE}
        total={total}
        buildHref={href}
        className="mt-8"
      />
    </div>
  );
}
