import { redirect } from "next/navigation";
import { HiOutlineCube, HiOutlineLightBulb } from "react-icons/hi2";
import { SupplierProductForm } from "@/components/supplier-product-form";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import {
  companiesByOwner,
  getCategories,
  getSystemConfig,
} from "@/lib/db/catalog";
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission";
import { getSessionUser } from "@/lib/server/session";

export default async function NewSupplierProductPage() {
  const user = await getSessionUser();
  if (user?.id && supplierHasOutstandingCommission(user.id)) {
    redirect("/supplier/orders?hold=commission");
  }
  const companies = user ? companiesByOwner(user.id) : [];
  const categories = getCategories();
  const system = getSystemConfig();

  return (
    <div>
      <header className="relative mb-2 overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 to-primary/[0.06] p-6 shadow-sm ring-1 ring-base-300/25 sm:p-8">
        <SupplierHeroBackdrop />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HiOutlineCube className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              Post product
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/70">
              Posting may deduct points when free posting is disabled. Featured
              listings can cost extra points when configured in system settings.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-xs font-medium text-base-content">
              <HiOutlineLightBulb className="h-4 w-4 shrink-0 text-warning" />
              Clear photos and accurate MOQ help merchants buy with confidence.
            </div>
          </div>
        </div>
      </header>
      <SupplierProductForm
        companies={companies}
        categories={categories}
        postProductPoints={system.postProductPoints}
        featuredProductCost={system.featuredProductCost}
        freePostingEnabled={system.freePostingEnabled}
      />
    </div>
  );
}
