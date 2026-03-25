"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { LucyMerchantMarkBadge } from "@/components/brand/lucy-merchant-mark";
import { brandCopy } from "@/lib/brand/copy";

export type SidebarLink = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function SidebarLayout({
  title,
  links,
  children,
  contentMaxWidthClass = "max-w-6xl",
  topBanner,
}: {
  title: string;
  links: SidebarLink[];
  children: ReactNode;
  contentMaxWidthClass?: string;
  /** e.g. account hold notice — full width above main content */
  topBanner?: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function active(href: string) {
    if (href === "/browse") {
      return pathname === "/browse" || pathname.startsWith("/products/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-w-0 flex-1">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/40 bg-card lg:block">
        <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col">
          {/* Sidebar Header */}
          <div className="border-b border-border/40 p-4">
            <div className="flex items-center gap-3">
              <LucyMerchantMarkBadge badgeSize="sm" markSize="md" />
              <div>
                <p className="font-display font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              {links.map((link) => {
                const isActive = active(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={clsx(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span
                        className={clsx(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}
                      >
                        {link.icon}
                      </span>
                      <span className="flex-1">{link.label}</span>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-border/40 p-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LucyMerchantMarkBadge badgeSize="sm" markSize="sm" className="scale-90" />
              {brandCopy.name}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-5 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card text-foreground transition-colors hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <LucyMerchantMarkBadge badgeSize="sm" markSize="sm" className="shrink-0" />
            <span className="font-display font-semibold text-foreground">{title}</span>
          </div>
        </div>

        {topBanner ? (
          <div className="w-full min-w-0 shrink-0 border-b border-border/50 bg-muted/30">
            {topBanner}
          </div>
        ) : null}

        {/* Content */}
        <motion.div
          className={`mx-auto w-full min-w-0 ${contentMaxWidthClass} px-4 py-5 sm:px-5 sm:py-7 md:px-6 lg:px-8 lg:py-8`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border/40 bg-card lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="flex h-full flex-col">
                {/* Mobile Sidebar Header */}
                <div className="flex items-center justify-between border-b border-border/40 p-4">
                  <div className="flex items-center gap-3">
                    <LucyMerchantMarkBadge badgeSize="md" markSize="lg" />
                    <div>
                      <p className="font-display font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">Portal</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeMobile}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card text-foreground transition-colors hover:bg-muted"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 overflow-y-auto p-3">
                  <ul className="space-y-1">
                    {links.map((link) => {
                      const isActive = active(link.href);
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={closeMobile}
                            className={clsx(
                              "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <span
                              className={clsx(
                                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                              )}
                            >
                              {link.icon}
                            </span>
                            <span className="flex-1">{link.label}</span>
                            {isActive && (
                              <ChevronRight className="h-4 w-4 text-primary" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Mobile Sidebar Footer */}
                <div className="border-t border-border/40 p-4">
                  <Link
                    href="/"
                    onClick={closeMobile}
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <LucyMerchantMarkBadge badgeSize="sm" markSize="sm" className="scale-90" />
                    Back to {brandCopy.name}
                  </Link>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
