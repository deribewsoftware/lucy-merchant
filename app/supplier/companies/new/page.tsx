import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { SupplierCompanyForm } from "@/components/supplier-company-form";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";

export default function NewSupplierCompanyPage() {
  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl border border-base-300/90 bg-base-100 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <SupplierHeroBackdrop />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <HiOutlineBuildingOffice2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-base-content sm:text-2xl">
                Register a new company
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-base-content/65">
                Add your business profile and verification documents. When an admin approves the company, you can
                list products under it.
              </p>
            </div>
          </div>
          <Link
            href="/supplier/companies"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-base-300 bg-base-100/90 px-4 py-2 text-sm font-semibold text-base-content shadow-sm transition hover:bg-base-200/90 sm:mt-0.5"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
        </div>
        <div className="relative mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.09] px-3.5 py-3">
          <HiOutlineShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[13px] leading-snug text-base-content/85">
            Finish Fayda identity verification on the Verification page first if you have not already — company
            review starts after your ID is approved.
          </p>
        </div>
      </div>

      <SupplierCompanyForm embedded />
    </div>
  );
}
