import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { AdminCompanyVerify } from "@/components/admin-company-verify";
import { listCompanies } from "@/lib/db/catalog";

export default function AdminCompaniesPage() {
  const pending = listCompanies().filter((c) => !c.isVerified);

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
              marketplace. {pending.length} pending
              {pending.length === 1 ? "" : "s"} in queue.
            </p>
          </div>
        </div>
      </header>
      <AdminCompanyVerify companies={pending} />
    </div>
  );
}
