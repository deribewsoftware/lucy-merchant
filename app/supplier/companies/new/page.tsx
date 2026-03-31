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
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-r from-primary/[0.07] via-base-100 to-secondary/[0.06] p-5 shadow-md ring-1 ring-base-300/25 sm:p-6">
        <SupplierHeroBackdrop />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <HiOutlineBuildingOffice2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-base-content sm:text-2xl">
                Register a new company
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-base-content/65">
                Submit legal details and documents for review. After approval, you can assign products to this
                profile.
              </p>
            </div>
          </div>
          <Link
            href="/supplier/companies"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-base-300 bg-base-100 px-4 py-2 text-sm font-semibold text-base-content transition hover:bg-base-200/80 sm:self-center"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
        </div>
        <div className="relative mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5 sm:inline-flex sm:items-center">
          <HiOutlineShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[12px] leading-relaxed text-base-content/80">
            Complete Fayda identity verification first if you have not already — company review runs after your
            ID is approved.
          </p>
        </div>
      </div>

      <SupplierCompanyForm embedded />
    </div>
  );
}
