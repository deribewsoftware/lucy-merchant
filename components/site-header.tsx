import { SiteHeaderClient } from "@/components/site-header-client";
import { getCategories } from "@/lib/db/catalog";
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission";
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission";
import { getSessionUser } from "@/lib/server/session";

export async function SiteHeader() {
  const user = await getSessionUser();
  const headerUser = user
    ? { name: user.name, email: user.email, role: user.role }
    : null;
  const merchantCommissionHold =
    user?.role === "merchant"
      ? merchantHasOutstandingCommission(user.id)
      : false;
  const supplierCommissionHold =
    user?.role === "supplier"
      ? supplierHasOutstandingCommission(user.id)
      : false;
  const categories = getCategories().map((c) => ({ id: c.id, name: c.name }));
  return (
    <SiteHeaderClient
      user={headerUser}
      categories={categories}
      merchantCommissionHold={merchantCommissionHold}
      supplierCommissionHold={supplierCommissionHold}
    />
  );
}
