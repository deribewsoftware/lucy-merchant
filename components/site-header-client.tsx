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
  Factory,
  FolderTree,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogIn,
  Menu,
  Search,
  ShoppingCart,
  Store,
  UserPlus,
  X,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { LucyMerchantMarkBadge } from "@/components/brand/lucy-merchant-mark";
import {
  NavCategoryDropdown,
  NavCategoryMenuBody,
} from "@/components/nav-category-dropdown";
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
import { roleDisplayLabel } from "@/lib/admin-staff";
import { brandCopy } from "@/lib/brand/copy";

export type HeaderUser = {
  name: string;
  email: string;
  role: UserRole;
  /** Admin portal home; set when permissions are locked so header matches `/admin/pending-access`. */
  staffAdminHomeHref?: string;
} | null;

export type NavCategory = { id: string; name: string };

function portalHome(role: UserRole, staffAdminHomeHref?: string) {
  if (role === "admin" || role === "system_admin") {
    return staffAdminHomeHref ?? "/admin/dashboard";
  }
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

const MOBILE_DRAWER_EXPLORE: {
  href: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/search",
    label: "Search",
    sub: "Products & suppliers",
    icon: Search,
  },
  {
    href: "/browse",
    label: "Browse catalog",
    sub: "Shop by category",
    icon: FolderTree,
  },
  {
    href: "/companies",
    label: "Suppliers",
    sub: "Verified companies",
    icon: Building2,
  },
  { href: "/about", label: "About", sub: "Our story", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
];

const MOBILE_DRAWER_PORTALS: {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}[] = [
  {
    href: "/merchant/dashboard",
    label: "Merchant portal",
    icon: Store,
    match: (p) => p.startsWith("/merchant"),
  },
  {
    href: "/supplier/dashboard",
    label: "Supplier portal",
    icon: Factory,
    match: (p) => p.startsWith("/supplier"),
  },
];

function MobileDrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/45 bg-background/35 shadow-sm">
      <p className="border-b border-border/40 bg-muted/25 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="divide-y divide-border/30">{children}</div>
    </div>
  );
}

export function SiteHeaderClient({
  user,
  categories,
  merchantCommissionHold = false,
  supplierCommissionHold = false,
}: {
  user: HeaderUser;
  categories: NavCategory[];
  merchantCommissionHold?: boolean;
  supplierCommissionHold?: boolean;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/change-password"].some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

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

  const dashHref = user
    ? portalHome(user.role, user.staffAdminHomeHref)
    : "/";

  const avatarInitials = user ? initialsFromName(user.name) : "";
  const { selfIsOnline } = usePresenceSelf();

  if (isAuthRoute) return null;

  return (
    <>
      <motion.header
        initial={reduceMotion ? false : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={clsx(
          "sticky top-0 z-50 overflow-visible transition-all duration-300",
          scrolled
            ? "border-b border-border/30 bg-background/90 shadow-md shadow-background/10 backdrop-blur-xl"
            : "border-b border-border/40 bg-background/40 backdrop-blur-md",
        )}
      >
        <div className="lm-container">
          <div className="flex h-[3.75rem] items-center gap-2 sm:gap-3 md:gap-4 lg:h-16">
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
            <Link
              href="/"
              className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5 md:gap-3"
            >
              <LucyMerchantMarkBadge
                badgeSize="md"
                markSize="lg"
                className="transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-xl group-hover:shadow-primary/35"
              />
              <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                <span className="font-display text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg md:text-xl">
                  {brandCopy.name}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-[11px] md:tracking-[0.22em]">
                  B2B Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation — categories */}
            <nav
              className="hidden min-w-0 shrink-0 items-center gap-1.5 overflow-visible lg:flex"
              aria-label="Primary"
            >
              <Suspense
                fallback={
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
                }
              >
                <NavCategoryDropdown categories={categories} />
              </Suspense>
            </nav>

            {/* Search */}
            <div className="mx-2 hidden min-w-0 flex-1 md:mx-3 md:block lg:mx-4 lg:max-w-2xl">
              <SearchBox
                merchantCommissionHold={merchantCommissionHold}
                supplierCommissionHold={supplierCommissionHold}
              />
            </div>

            {/* Right Actions */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              
              {user ? (
                <>
                  <div className="hidden sm:block">
                    <NotificationBell compact />
                  </div>
                  
                  {/* User Menu — desktop / tablet only; mobile uses drawer */}
                  <div className="dropdown dropdown-end hidden lg:block">
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
                        <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {roleDisplayLabel(user.role)}
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
                  <div
                    className="pointer-events-none shrink-0 lg:hidden"
                    aria-hidden
                  >
                    <PresenceAvatar
                      size="sm"
                      selfOnline={Boolean(user) && selfIsOnline}
                      className="border border-border/40 bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground shadow-sm"
                    >
                      {avatarInitials}
                    </PresenceAvatar>
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

          {/* Mobile: search only — categories live in the drawer list */}
          <div className="border-t border-border/40 bg-muted/25 px-0 py-2.5 md:hidden">
            <SearchBox
              layout="mobileBar"
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
              className="fixed inset-y-0 left-0 z-[70] flex max-h-dvh w-[min(100vw-2.5rem,20rem)] flex-col border-r border-border/40 bg-card lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Drawer Header */}
              <div className="flex shrink-0 items-center gap-3 border-b border-border/40 p-4">
                <LucyMerchantMarkBadge badgeSize="lg" markSize="xl" />
                <div className="min-w-0">
                  <p className="font-display font-bold text-foreground">{brandCopy.name}</p>
                  <p className="text-xs text-muted-foreground">Menu</p>
                </div>
              </div>

              {/* Drawer Content — flat lists, scrolls */}
              <nav
                className={clsx(
                  "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3",
                  user ? "pb-6" : "pb-36",
                )}
              >
                {user && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border/45 bg-muted/20 p-3">
                      <div className="flex items-center gap-3">
                        <PresenceAvatar
                          size="sm"
                          selfOnline={Boolean(user) && selfIsOnline}
                          className="bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground"
                        >
                          {avatarInitials}
                        </PresenceAvatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                          <span className="mt-1.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                            {roleDisplayLabel(user.role)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <PresenceStatusLine selfOnline={selfIsOnline} />
                      </div>
                    </div>

                    <MobileDrawerSection title="Account">
                      <Link
                        href={dashHref}
                        onClick={closeMobile}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-3.5 text-sm transition-colors",
                          isPathActive(pathname, dashHref)
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground hover:bg-muted/80",
                        )}
                      >
                        <LayoutDashboard className="h-5 w-5 shrink-0 text-primary/85" />
                        Dashboard
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={closeMobile}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-3.5 text-sm transition-colors",
                          pathname === "/notifications" || pathname.startsWith("/notifications/")
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground hover:bg-muted/80",
                        )}
                      >
                        <Bell className="h-5 w-5 shrink-0 text-primary/85" />
                        Notifications
                      </Link>
                      {user.role === "merchant" && (
                        <>
                          <Link
                            href="/merchant/cart"
                            onClick={closeMobile}
                            className={clsx(
                              "flex items-center gap-3 px-3 py-3.5 text-sm transition-colors",
                              pathname.startsWith("/merchant/cart")
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-foreground hover:bg-muted/80",
                            )}
                          >
                            <ShoppingCart className="h-5 w-5 shrink-0 text-primary/85" />
                            Cart
                          </Link>
                          <Link
                            href="/merchant/orders"
                            onClick={closeMobile}
                            className={clsx(
                              "flex items-center gap-3 px-3 py-3.5 text-sm transition-colors",
                              pathname.startsWith("/merchant/orders")
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-foreground hover:bg-muted/80",
                            )}
                          >
                            <ClipboardList className="h-5 w-5 shrink-0 text-primary/85" />
                            Orders
                          </Link>
                        </>
                      )}
                      <div className="border-t border-border/35 bg-muted/30 p-2">
                        <SignOutButton className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10" />
                      </div>
                    </MobileDrawerSection>
                  </div>
                )}

                <MobileDrawerSection title="Explore">
                  {MOBILE_DRAWER_EXPLORE.map((link) => {
                    const active = isPathActive(pathname, link.href);
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMobile}
                        className={clsx(
                          "flex gap-3 px-3 py-3.5 transition-colors",
                          active
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground hover:bg-muted/80",
                        )}
                      >
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary/80" />
                        <span className="min-w-0">
                          <span className="block text-sm leading-snug">{link.label}</span>
                          {link.sub ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {link.sub}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    );
                  })}
                </MobileDrawerSection>

                {categories.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-border/45 bg-background/35 shadow-sm">
                    <p className="border-b border-border/40 bg-muted/25 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Shop by category
                    </p>
                    <div className="max-h-[min(40vh,16rem)] overflow-y-auto overscroll-contain">
                      <Suspense
                        fallback={
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            Loading…
                          </div>
                        }
                      >
                        <NavCategoryMenuBody
                          categories={categories}
                          onNavigate={closeMobile}
                          compact
                        />
                      </Suspense>
                    </div>
                  </div>
                )}

                <MobileDrawerSection title="Portals">
                  {MOBILE_DRAWER_PORTALS.map((p) => {
                    const active = p.match(pathname);
                    const Icon = p.icon;
                    return (
                      <Link
                        key={p.href}
                        href={p.href}
                        onClick={closeMobile}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-3.5 text-sm transition-colors",
                          active
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground hover:bg-muted/80",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary/85" />
                        {p.label}
                      </Link>
                    );
                  })}
                </MobileDrawerSection>
              </nav>

              {/* Drawer Footer — guests only */}
              {!user && (
                <div className="shrink-0 border-t border-border/40 bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
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
