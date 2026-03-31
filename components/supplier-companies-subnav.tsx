"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineBuildingOffice2,
  HiOutlinePlusCircle,
  HiOutlineSquares2X2,
} from "react-icons/hi2";

const items = [
  { href: "/supplier/companies", label: "All companies", icon: HiOutlineSquares2X2 },
  { href: "/supplier/companies/new", label: "Register new", icon: HiOutlinePlusCircle },
] as const;

export function SupplierCompaniesSubnav() {
  const pathname = usePathname();
  const onManage = pathname?.startsWith("/supplier/companies/") && pathname !== "/supplier/companies/new";

  return (
    <nav
      aria-label="Company workspace"
      className="flex flex-wrap gap-2 border-b border-base-300/80 pb-4"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/supplier/companies"
            ? pathname === "/supplier/companies"
            : pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                : "border border-base-300 bg-base-100 text-base-content/80 hover:border-primary/40 hover:bg-base-200/60"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      {onManage ? (
        <span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.06] px-4 py-2.5 text-sm font-medium text-primary">
          <HiOutlineBuildingOffice2 className="h-4 w-4" />
          Manage company
        </span>
      ) : null}
    </nav>
  );
}
