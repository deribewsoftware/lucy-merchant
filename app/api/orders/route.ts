import { NextResponse } from "next/server";
import { companiesByOwner } from "@/lib/db/catalog";
import {
  listOrders,
  ordersForMerchant,
  ordersForSupplierCompanyIds,
} from "@/lib/db/commerce";
import { isStaffAdminRole } from "@/lib/admin-staff";
import { getSessionUser } from "@/lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "merchant") {
    return NextResponse.json({ orders: ordersForMerchant(user.id) });
  }

  if (user.role === "supplier") {
    const mine = companiesByOwner(user.id).map((c) => c.id);
    return NextResponse.json({
      orders: ordersForSupplierCompanyIds(mine),
    });
  }

  if (isStaffAdminRole(user.role)) {
    return NextResponse.json({
      orders: listOrders().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
