"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HiMenuAlt3 } from "react-icons/hi";
import type { ReactNode } from "react";

export type SidebarLink = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function SidebarLayout({
  title,
  links,
  children,
  contentMaxWidthClass = "max-w-5xl",
}: {
  title: string;
  links: SidebarLink[];
  children: ReactNode;
  /** Main column width (e.g. max-w-7xl for analytics-heavy portals) */
  contentMaxWidthClass?: string;
}) {
  const pathname = usePathname();

  function active(href: string) {
    if (href === "/browse") {
      return pathname === "/browse" || pathname.startsWith("/products/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="portal-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content min-h-[calc(100dvh-5.5rem)] w-full max-w-full flex-1 overflow-x-hidden">
        <div className="flex items-center gap-2 border-b border-base-300 bg-base-100 px-3 py-3 lg:hidden">
          <label
            htmlFor="portal-drawer"
            className="btn btn-square btn-ghost drawer-button"
            aria-label="Open sidebar"
          >
            <HiMenuAlt3 className="h-6 w-6" />
          </label>
          <span className="font-semibold text-base-content">{title}</span>
        </div>
        <motion.div
          className={`mx-auto w-full ${contentMaxWidthClass} px-4 py-6 sm:px-6 lg:px-8`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {children}
        </motion.div>
      </div>
      <div className="drawer-side z-40">
        <label
          htmlFor="portal-drawer"
          aria-label="Close menu"
          className="drawer-overlay lg:hidden"
        />
        <aside className="flex min-h-full w-64 flex-col border-r border-base-300 bg-base-200">
          <div className="border-b border-base-300 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">
              {title}
            </p>
          </div>
          <ul className="menu menu-md w-full gap-0.5 p-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={active(l.href) ? "active font-semibold" : ""}
                >
                  <span className="inline-flex w-8 justify-center">{l.icon}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
