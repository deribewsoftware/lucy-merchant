import {
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { SupplierCompanyEditForm } from "@/components/supplier-company-edit-form";
import { SupplierCompanyForm } from "@/components/supplier-company-form";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import { companiesByOwner } from "@/lib/db/catalog";
import { getSessionUser } from "@/lib/server/session";

export default async function SupplierCompaniesPage() {
  const user = await getSessionUser();
  const list = user ? companiesByOwner(user.id) : [];

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 via-secondary/[0.06] to-primary/[0.07] p-6 shadow-sm ring-1 ring-base-300/25 sm:p-8">
        <SupplierHeroBackdrop />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HiOutlineBuildingOffice2 className="h-7 w-7" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Companies
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-base-content/70">
                Register brands or legal entities. Each profile must be verified by
                an admin before you can publish products under it.
              </p>
            </div>
          </div>
          <div className="flex max-w-sm items-center gap-2 rounded-xl border border-success/35 bg-success/10 px-3 py-2.5">
            <HiOutlineShieldCheck className="h-5 w-5 shrink-0 text-success" />
            <span className="text-xs font-medium text-base-content">
              Verification required for listings
            </span>
          </div>
        </div>
      </header>

      <SupplierCompanyForm />

      <section>
        <h2 className="text-lg font-semibold text-base-content">
          Your organizations
        </h2>
        <p className="mt-1 text-sm text-base-content/60">
          Edit details anytime; verification badges update when admins approve.
        </p>
        <ul className="mt-6 space-y-4">
          {list.length === 0 && (
            <li className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-6 py-10 text-center text-sm text-base-content/60">
              No companies yet — use the form above to register your first one.
            </li>
          )}
          {list.map((c) => (
            <li
              key={c.id}
              className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm ring-1 ring-base-300/15"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-300 bg-base-200/25 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-base-100 text-primary shadow-sm ring-1 ring-base-300/40">
                    <HiOutlineBuildingOffice2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-base-content">
                      {c.name}
                    </p>
                    <p className="mt-0.5 text-xs text-base-content/50">
                      ID <span className="font-mono">{c.id}</span>
                    </p>
                  </div>
                </div>
                <span
                  className={
                    c.isVerified
                      ? "inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success"
                      : "inline-flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning"
                  }
                >
                  {c.isVerified ? (
                    <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                  ) : null}
                  {c.isVerified ? "Verified" : "Pending verification"}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm leading-relaxed text-base-content/75">
                  {c.description}
                </p>
                {c.businessAddress?.trim() ? (
                  <p className="mt-3 text-sm text-base-content/60">
                    <span className="font-medium text-base-content/80">
                      Location:{" "}
                    </span>
                    {c.businessAddress.trim()}
                  </p>
                ) : null}
                <SupplierCompanyEditForm company={c} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
