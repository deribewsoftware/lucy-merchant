import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineBuildingOffice2,
  HiOutlinePlusCircle,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { SupplierCompaniesBoard } from "@/components/supplier-companies-board";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import { companyApprovedOrVerified } from "@/lib/domain/types";
import { companiesByOwner, listProducts } from "@/lib/db/catalog";
import { getSessionUser } from "@/lib/server/session";

export default async function SupplierCompaniesPage() {
  const user = await getSessionUser();
  const list = user ? companiesByOwner(user.id) : [];

  const productCountByCompanyId: Record<string, number> = {};
  for (const p of listProducts()) {
    productCountByCompanyId[p.companyId] = (productCountByCompanyId[p.companyId] ?? 0) + 1;
  }

  const verified = list.filter((c) => companyApprovedOrVerified(c)).length;
  const pending = list.filter(
    (c) => !c.isVerified && c.verificationStatus !== "rejected",
  ).length;
  const declined = list.filter((c) => c.verificationStatus === "rejected").length;

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-primary/[0.06] to-secondary/[0.09] p-6 shadow-lg ring-1 ring-base-300/30 sm:p-8">
        <SupplierHeroBackdrop />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner ring-1 ring-primary/20">
              <HiOutlineBuildingOffice2 className="h-9 w-9" />
            </span>
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-base-100/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/15">
                <HiOutlineSparkles className="h-3.5 w-3.5" />
                Company workspace
              </p>
              <h1 className="font-display mt-3 text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Your organizations
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-base-content/70">
                Each brand or legal entity is verified once by an admin. Register new companies on a dedicated
                page. You can edit details until verification; after that the profile is locked for buyers,
                and you can remove the company only after deleting all of its product listings.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/supplier/companies/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-content shadow-lg shadow-primary/25 transition hover:bg-primary/90"
                >
                  <HiOutlinePlusCircle className="h-5 w-5" />
                  Register new company
                  <HiOutlineArrowRight className="h-4 w-4 opacity-90" />
                </Link>
                <Link
                  href="/supplier/verification"
                  className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold text-base-content transition hover:bg-base-200/80"
                >
                  <HiOutlineShieldCheck className="h-5 w-5 text-success" />
                  Identity (Fayda)
                </Link>
              </div>
            </div>
          </div>

          <div className="grid w-full min-w-0 gap-3 sm:grid-cols-3 lg:w-auto lg:max-w-md">
            <div className="rounded-2xl border border-base-300/70 bg-base-100/80 px-4 py-3 text-center shadow-sm backdrop-blur-sm ring-1 ring-base-300/20">
              <p className="text-2xl font-bold tabular-nums text-base-content">{list.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">Total</p>
            </div>
            <div className="rounded-2xl border border-success/30 bg-success/[0.08] px-4 py-3 text-center shadow-sm">
              <p className="text-2xl font-bold tabular-nums text-success">{verified}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-success/80">Verified</p>
            </div>
            <div className="rounded-2xl border border-warning/35 bg-warning/[0.08] px-4 py-3 text-center shadow-sm">
              <p className="text-2xl font-bold tabular-nums text-warning">{pending}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-warning/90">Pending</p>
            </div>
          </div>
        </div>
        {declined > 0 ? (
          <p className="relative mt-6 rounded-xl border border-error/25 bg-error/5 px-4 py-2 text-center text-xs text-base-content/75">
            <span className="font-semibold text-error">{declined}</span> profile
            {declined === 1 ? "" : "s"} need attention — open each company to read the reason and update
            documents.
          </p>
        ) : null}
      </header>

      <SupplierCompaniesBoard companies={list} productCountByCompanyId={productCountByCompanyId} />
    </div>
  );
}
