import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HiArrowLeft, HiOutlinePencilSquare } from "react-icons/hi2";
import { SupplierProductEditForm } from "@/components/supplier-product-edit-form";
import { SupplierHeroBackdrop } from "@/components/supplier/supplier-portal-graphics";
import {
  getCategories,
  getCompany,
  getProduct,
  getSystemConfig,
} from "@/lib/db/catalog";
import { getSessionUser } from "@/lib/server/session";

type Params = { params: Promise<{ id: string }> };

export default async function SupplierEditProductPage({ params }: Params) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/supplier/products");

  const product = getProduct(id);
  if (!product) notFound();

  const company = getCompany(product.companyId);
  if (!company || company.ownerId !== user.id) {
    redirect("/supplier/products");
  }
  if (!company.isVerified) {
    redirect("/supplier/companies");
  }

  const categories = getCategories();
  const cfg = getSystemConfig();

  return (
    <div>
      <Link
        href="/supplier/products"
        className="link link-primary mb-6 inline-flex items-center gap-2 text-sm font-medium no-underline hover:underline"
      >
        <HiArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>
      <header className="relative mb-2 overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-base-100 to-secondary/[0.08] p-6 shadow-sm ring-1 ring-base-300/25 sm:p-8">
        <SupplierHeroBackdrop />
        <div className="relative flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <HiOutlinePencilSquare className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              Edit listing
            </h1>
            <p className="mt-2 max-w-xl text-sm text-base-content/70">
              Updates apply immediately on the public catalog.
            </p>
          </div>
        </div>
      </header>
      <SupplierProductEditForm
        product={product}
        categories={categories}
        featuredProductCost={cfg.featuredProductCost}
      />
    </div>
  );
}
