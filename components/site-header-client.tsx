"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import clsx from "clsx";
import {
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  Menu,
  Search,
  ShoppingCart,
  UserPlus,
  X,
  Sparkles,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavCategoryDropdown } from "@/components/nav-category-dropdown";
import {
  PresenceAvatar,
  PresenceStatusLine,
} from "@/components/presence-avatar";
import { usePresenceSelf } from "@/components/presence-provider";
import { NotificationBell } from "@/components/notification-bell";
import { SearchBox } from "@/components/search-box";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/lib/domain/types";
import { brandCopy } from "@/lib/brand/copy";

export type HeaderUser = {
  name: string;
  email: string;
  role: UserRole;
} | null;

export type NavCategory = { id: string; name: string };

function portalHome(role: UserRole) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "supplier") return "/supplier/dashboard";
  return "/merchant/dashboard";
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeaderClient({
  user,
  categories,
  merchantCommissionHold = false,
  supplierCommissionHold = false,
}: {
  user: HeaderUser;
  categories: NavCategory[];
  /** Unpaid buyer platform fee on a delivered order — surfaces near search on public pages */
  merchantCommissionHold?: boolean;
  /** Unpaid supplier platform fee — surfaces near search on public pages */
  supplierCommissionHold?: boolean;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [mobileCatQuery, setMobileCatQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const filteredMobileCategories = useMemo(() => {
    const s = mobileCatQuery.trim().toLowerCase();
    if (!s) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(s));
  }, [categories, mobileCatQuery]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      setMobileCatQuery("");
      setMobileCatsOpen(false);
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const dashHref = user ? portalHome(user.role) : "/";

  const navSpring = useMemo(
    () =>
      reduceMotion
        ? { duration: 0.15 }
        : { type: "spring" as const, stiffness: 500, damping: 30 },
    [reduceMotion],
  );

  const avatarInitials = user ? initialsFromName(user.name) : "";
  const { selfIsOnline } = usePresenceSelf();

  const navLinks = [
    { href: "/browse", label: "Browse", icon: LayoutGrid },
    { href: "/companies", label: "Suppliers", icon: Building2 },
  ];

  return (
    <>
      <motion.header
        initial={reduceMotion ? false : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={clsx(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/30 bg-background/80 shadow-md shadow-background/10 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="lm-container">
          <div className="flex h-16 items-center gap-4">
            {/* Mobile Menu Button */}
            <motion.button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-foreground transition-colors hover:bg-card lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="x"
                    initial={reduceMotion ? false : { rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={reduceMotion ? undefined : { rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={reduceMotion ? false : { rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={reduceMotion ? undefined : { rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="font-display text-lg font-bold tracking-tight text-foreground">
                  {brandCopy.name}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  B2B Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {navLinks.map((link) => {
                const active = isPathActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/15"
                        transition={navSpring}
                      />
                    )}
                  </Link>
                );
              })}
              <Suspense
                fallback={
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
                }
              >
                <NavCategoryDropdown categories={categories} />
              </Suspense>
            </nav>

            {/* Search */}
            <div className="mx-4 hidden flex-1 md:block lg:max-w-xl">
              <SearchBox
                merchantCommissionHold={merchantCommissionHold}
                supplierCommissionHold={supplierCommissionHold}
              />
            </div>

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              
              {user ? (
                <>
                  <div className="hidden sm:block">
                    <NotificationBell compact />
                  </div>
                  
                  {/* User Menu */}
                  <div className="dropdown dropdown-end">
                    <motion.button
                      tabIndex={0}
                      className="flex h-10 min-w-0 items-center gap-1.5 overflow-visible rounded-full border border-border/40 bg-card/40 pl-1.5 pr-2.5 transition-all hover:border-primary/25 hover:bg-card sm:gap-2 sm:pl-1 sm:pr-3"
                      aria-label="Account menu"
                      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    >
                      <PresenceAvatar
                        size="sm"
                        selfOnline={Boolean(user) && selfIsOnline}
                        className="bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground"
                      >
                        {avatarInitials}
                      </PresenceAvatar>
                      <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                    </motion.button>
                    <div
                      tabIndex={0}
                      className="dropdown-content z-[100] mt-2 w-72 rounded-xl border border-border/45 bg-card p-2 shadow-xl"
                    >
                      {/* User Info */}
                      <div className="border-b border-border/40 px-3 py-3">
                        <p className="truncate font-semibold text-foreground">
                          {user.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="mt-1.5">
                          <PresenceStatusLine selfOnline={selfIsOnline} />
                        </div>
                        <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                          {user.role}
                        </span>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href={dashHref}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          Dashboard
                        </Link>
                        <Link
                          href="/notifications"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted sm:hidden"
                        >
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          Notifications
                        </Link>
                        {user.role === "merchant" && (
                          <>
                            <Link
                              href="/merchant/cart"
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                            >
                              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                              Cart
                            </Link>
                            <Link
                              href="/merchant/orders"
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                            >
                              <ClipboardList className="h-4 w-4 text-muted-foreground" />
                              Orders
                            </Link>
                          </>
                        )}
                      </div>
                      
                      {/* Sign Out */}
                      <div className="border-t border-border/40 pt-2">
                        <SignOutButton className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex h-10 items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-4 text-sm font-medium text-foreground transition-all hover:border-primary/25 hover:bg-card"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign in</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Register</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="border-t border-border/35 py-3 md:hidden">
            <SearchBox
              merchantCommissionHold={merchantCommissionHold}
              supplierCommissionHold={supplierCommissionHold}
            />
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-[70] w-80 max-w-[calc(100vw-3rem)] border-r border-border/40 bg-card lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Drawer Header */}
              <div className="flex items-center gap-3 border-b border-border/40 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground">{brandCopy.name}</p>
                  <p className="text-xs text-muted-foreground">Navigation</p>
                </div>
              </div>

              {/* Drawer Content */}
              <nav className="flex flex-col gap-1 p-3">
                {navLinks.map((link) => {
                  const active = isPathActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobile}
                      className={clsx(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}

                {/* Categories Accordion */}
                {categories.length > 0 && (
                  <div className="rounded-lg border border-border/45">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setMobileCatsOpen((o) => !o)}
                    >
                      <span className="flex items-center gap-3">
                        <LayoutGrid className="h-5 w-5" />
                        Categories
                      </span>
                      <motion.span
                        animate={{ rotate: mobileCatsOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {mobileCatsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-border/40"
                        >
                          <div className="p-2">
                            <div className="relative mb-2">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search categories..."
                                value={mobileCatQuery}
                                onChange={(e) => setMobileCatQuery(e.target.value)}
                                className="lm-input pl-10 text-sm"
                              />
                            </div>
                            <div className="max-h-48 space-y-1 overflow-y-auto">
                              {filteredMobileCategories.map((cat) => (
                                <Link
                                  key={cat.id}
                                  href={`/browse?category=${encodeURIComponent(cat.id)}`}
                                  onClick={closeMobile}
                                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                  {cat.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </nav>

              {/* Drawer Footer */}
              {!user && (
                <div className="absolute bottom-0 left-0 right-0 border-t border-border/40 p-4">
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={closeMobile}
                      className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border/45 bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobile}
                      className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
                    >
                      <UserPlus className="h-4 w-4" />
                      Create account
                    </Link>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
