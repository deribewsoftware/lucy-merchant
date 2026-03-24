import { SiteHeaderClient } from "@/components/site-header-client";
import { getCategories } from "@/lib/db/catalog";
import { getSessionUser } from "@/lib/server/session";

export async function SiteHeader() {
  const user = await getSessionUser();
  const headerUser = user
    ? { name: user.name, email: user.email, role: user.role }
    : null;
  const categories = getCategories().map((c) => ({ id: c.id, name: c.name }));
  return <SiteHeaderClient user={headerUser} categories={categories} />;
}
