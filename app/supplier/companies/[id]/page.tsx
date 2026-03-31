import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { SupplierCompanyEditForm } from "@/components/supplier-company-edit-form";
import { SupplierDeleteCompanyButton } from "@/components/supplier-delete-company-button";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import { companyApprovedOrVerified } from "@/lib/domain/types";
import { stripHtmlToPlainText } from "@/lib/rich-text";
import { getCompany, listProducts } from "@/lib/db/catalog";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

export default async function ManageSupplierCompanyPage({ params }: Params) {
  const user = await getSessionUser();
  const { id } = await params;
  const company = getCompany(id);
  if (!user || user.role !== "supplier" || !company || company.ownerId !== user.id) {
    notFound();
  }

  const verified = companyApprovedOrVerified(company);
  const rejected = company.verificationStatus === "rejected";
  const productCount = listProducts().filter((p) => p.companyId === id).length;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-primary/[0.05] to-secondary/[0.08] p-5 shadow-lg ring-1 ring-base-300/30 sm:p-7">
        <SupplierHeroBackdrop />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href="/supplier/companies"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <HiOutlineArrowLeft className="h-4 w-4" />
              All companies
            </Link>
            <div className="mt-4 flex flex-wrap items-start gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-base-100 text-primary shadow-md ring-1 ring-base-300/50">
                <HiOutlineBuildingOffice2 className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                  {company.name}
                </h1>
                <p className="mt-1 font-mono text-[11px] text-base-content/45">ID {company.id}</p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-base-content/70">
                  {stripHtmlToPlainText(company.description)}
                </p>
                {company.businessAddress?.trim() ? (
                  <p className="mt-3 flex items-start gap-2 text-sm text-base-content/60">
                    <HiOutlineMapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {company.businessAddress.trim()}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-4 py-2 text-sm font-semibold text-success ring-1 ring-success/25">
                <HiOutlineShieldCheck className="h-5 w-5" />
                Verified
              </span>
            ) : rejected ? (
              <span className="rounded-full bg-error/15 px-4 py-2 text-sm font-semibold text-error ring-1 ring-error/20">
                Declined — update &amp; resubmit
              </span>
            ) : (
              <span className="rounded-full bg-warning/15 px-4 py-2 text-sm font-semibold text-warning ring-1 ring-warning/25">
                Pending admin review
              </span>
            )}
            <Link
              href={`/companies/${company.id}`}
              className="text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              View public profile
            </Link>
          </div>
        </div>
        {rejected && company.rejectionReason ? (
          <div className="relative mt-5 rounded-xl border border-error/25 bg-error/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-error/80">Last decline reason</p>
            <p className="mt-1 text-sm text-base-content/80">{company.rejectionReason}</p>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-base-content sm:text-xl">
          {verified ? "Profile (verified — read-only)" : "Profile & settings"}
        </h2>
        <SupplierCompanyEditForm company={company} mode="page" />
      </div>

      <section className="rounded-2xl border border-error/25 bg-error/[0.03] p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-base-content sm:text-lg">Danger zone</h2>
        <p className="mt-2 max-w-2xl text-sm text-base-content/70">
          {verified ? (
            <>
              For a verified company, delete every product listing first, then you can remove the empty
              organization here. You cannot delete a company while you have an outstanding platform
              commission balance (same rule as deleting products).
            </>
          ) : (
            <>
              Permanently remove this company and all of its product listings. You cannot delete a company
              while you have an outstanding platform commission balance (same rule as deleting products).
            </>
          )}
        </p>
        {verified && productCount > 0 ? (
          <p className="mt-3 text-sm font-medium text-base-content/80">
            <Link href="/supplier/products" className="text-primary underline-offset-4 hover:underline">
              Open product listings
            </Link>{" "}
            and remove items for this company before using Remove company.
          </p>
        ) : null}
        <div className="mt-4">
          <SupplierDeleteCompanyButton
            companyId={company.id}
            name={company.name}
            productCount={productCount}
            companyVerified={verified}
          />
        </div>
      </section>
    </div>
  );
}
