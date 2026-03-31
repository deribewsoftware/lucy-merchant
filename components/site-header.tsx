import { SiteHeaderClient } from "@/components/site-header-client";
import { isStaffAdminRole } from "@/lib/admin-staff";
import { getCategories } from "@/lib/db/catalog";
import { getFirstAccessibleAdminHref } from "@/lib/server/admin-permissions";
import { merchantHasOutstandingCommission } from "@/lib/server/merchant-commission";
import { supplierHasOutstandingCommission } from "@/lib/server/supplier-commission";
import { getSessionUser } from "@/lib/server/session";

export async function SiteHeader() {
  const user = await getSessionUser();
  const staffAdminHomeHref =
    user && isStaffAdminRole(user.role)
      ? getFirstAccessibleAdminHref(user.id)
      : undefined;
  const headerUser = user
    ? {
        name: user.name,
        email: user.email,
        role: user.role,
        ...(staffAdminHomeHref ? { staffAdminHomeHref } : {}),
      }
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
