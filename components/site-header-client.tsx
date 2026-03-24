"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import clsx from "clsx";
import {
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  Menu,
  Search,
  ShoppingCart,
  UserPlus,
  X,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavCategoryDropdown } from "@/components/nav-category-dropdown";
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
}: {
  user: HeaderUser;
  categories: NavCategory[];
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [mobileCatQuery, setMobileCatQuery] = useState("");

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
        ? { duration: 0.2 }
        : { type: "spring" as const, stiffness: 420, damping: 34 },
    [reduceMotion],
  );

  const headerMotion = reduceMotion
    ? { initial: false, animate: {} }
    : {
        initial: { y: -12, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
      };

  function DesktopNavLink({
    href,
    label,
    icon: Icon,
    active,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutGrid;
    active: boolean;
  }) {
    return (
      <Link
        href={href}
        className={clsx(
          "relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium outline-none transition-[color,transform] duration-200",
          "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
          active
            ? "text-primary"
            : "text-base-content/65 hover:bg-base-200/70 hover:text-base-content",
        )}
      >
        <Icon
          className={clsx(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            active && !reduceMotion && "scale-110",
          )}
          aria-hidden
        />
        <span>{label}</span>
        {active && (
          <motion.span
            layoutId="navbar-active-pill"
            className="absolute inset-0 -z-10 rounded-xl bg-primary/10 shadow-[inset_0_0_0_1px] shadow-primary/20"
            transition={navSpring}
          />
        )}
        {active && (
          <motion.span
            layoutId="navbar-active-bar"
            className="absolute bottom-0 left-1.5 right-1.5 h-0.5 rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
            transition={navSpring}
          />
        )}
      </Link>
    );
  }

  function MobileRow({
    href,
    label,
    icon: Icon,
    active,
    onNavigate,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutGrid;
    active: boolean;
    onNavigate?: () => void;
  }) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={clsx(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px] shadow-primary/25"
            : "text-base-content/80 hover:bg-base-200/80",
        )}
      >
        <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
        {label}
      </Link>
    );
  }

  const avatarInitials = user ? initialsFromName(user.name) : "";

  return (
    <>
    <motion.header
      {...headerMotion}
      className="sticky top-0 z-50 border-b border-base-300/70 bg-base-100/80 shadow-[0_1px_0_0] shadow-base-300/40 backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex min-h-0 items-center gap-2 py-1.5 sm:gap-2.5 sm:py-2">
          {/* Left: menu + brand */}
          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            <motion.button
              type="button"
              className="btn btn-ghost btn-square btn-xs h-8 min-h-8 w-8 rounded-lg border border-transparent hover:border-base-300/80 sm:btn-sm sm:h-9 sm:min-h-9 sm:w-9 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="x"
                    initial={reduceMotion ? false : { rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={reduceMotion ? undefined : { rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <X className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" strokeWidth={2.25} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={reduceMotion ? false : { rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={reduceMotion ? undefined : { rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <Menu className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" strokeWidth={2.25} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <Link
              href="/"
              className="group flex min-w-0 flex-col rounded-lg px-1.5 py-0.5 transition-[transform,opacity] duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 sm:px-2 sm:py-1"
            >
              <motion.span
                className="font-display truncate bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-[0.9375rem] font-bold leading-tight tracking-tight text-transparent sm:text-base"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {brandCopy.name}
              </motion.span>
              <span className="font-display hidden max-w-[11rem] truncate text-[0.58rem] font-semibold uppercase leading-tight tracking-[0.14em] text-base-content/42 sm:block">
                {brandCopy.tagline}
              </span>
            </Link>
          </div>

          {/* Desktop primary nav — Browse & Suppliers + categories; account links in avatar menu */}
          <LayoutGroup id="main-nav">
            <nav
              className="hidden items-center gap-0.5 lg:flex"
              aria-label="Primary"
            >
              <DesktopNavLink
                href="/browse"
                label="Browse"
                icon={LayoutGrid}
                active={isPathActive(pathname, "/browse")}
              />
              <DesktopNavLink
                href="/companies"
                label="Suppliers"
                icon={Building2}
                active={isPathActive(pathname, "/companies")}
              />
              <Suspense
                fallback={
                  <div
                    className="h-8 w-[5rem] animate-pulse rounded-lg bg-base-200/80"
                    aria-hidden
                  />
                }
              >
                <NavCategoryDropdown categories={categories} />
              </Suspense>
            </nav>
          </LayoutGroup>

          {/* Search (tablet+) */}
          <div className="mx-auto hidden min-w-0 max-w-xl flex-1 px-2 md:block lg:max-w-2xl xl:max-w-3xl">
            <SearchBox />
          </div>

          {/* Right tools */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <div
              className="hidden h-5 w-px bg-gradient-to-b from-transparent via-base-300 to-transparent sm:block"
              aria-hidden
            />
            <ThemeToggle />
            {user ? (
              <>
                <div className="hidden sm:block">
                  <NotificationBell compact />
                </div>
                <div className="dropdown dropdown-end">
                  <motion.div
                    tabIndex={0}
                    role="button"
                    className="btn btn-ghost h-9 min-h-0 gap-1.5 rounded-full border border-base-300/60 bg-base-200/25 pl-0.5 pr-1.5 hover:border-primary/35 hover:bg-base-200/55 sm:h-9"
                    aria-label="Account menu"
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/35 via-secondary/25 to-accent/30 text-[10px] font-bold text-primary shadow-inner sm:h-8 sm:w-8 sm:text-xs">
                      {avatarInitials}
                    </span>
                    <ChevronDown
                      className="hidden h-3.5 w-3.5 opacity-55 sm:block"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </motion.div>
                  <ul
                    tabIndex={0}
                    className="menu dropdown-content z-[100] mt-2 w-64 rounded-2xl border border-base-300/80 bg-base-100/95 p-2 shadow-2xl backdrop-blur-md"
                  >
                    <li className="menu-disabled px-3 py-2 opacity-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold text-base-content">
                          {user.name}
                        </span>
                        <span className="truncate text-xs text-base-content/55">
                          {user.email}
                        </span>
                        <span className="mt-1 inline-flex w-fit rounded-full bg-base-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-base-content/60">
                          {user.role}
                        </span>
                      </div>
                    </li>
                    <div className="divider my-1 before:bg-base-300/60 after:bg-base-300/60" />
                    <li>
                      <Link
                        href={dashHref}
                        className="rounded-xl !flex-row gap-2"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </li>
                    <li className="sm:hidden">
                      <Link
                        href="/notifications"
                        className="rounded-xl !flex-row gap-2"
                      >
                        <Bell className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                        Notifications
                      </Link>
                    </li>
                    {user.role === "merchant" && (
                      <>
                        <li>
                          <Link
                            href="/merchant/cart"
                            className="rounded-xl !flex-row gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Cart
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/merchant/orders"
                            className="rounded-xl !flex-row gap-2"
                          >
                            <ClipboardList className="h-4 w-4" />
                            Orders
                          </Link>
                        </li>
                      </>
                    )}
                    <div className="divider my-1 before:bg-base-300/60 after:bg-base-300/60" />
                    <li>
                      <SignOutButton className="rounded-xl !flex-row gap-2 hover:bg-error/10 hover:text-error" />
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={clsx(
                    "btn btn-ghost btn-sm gap-1.5 rounded-full border border-base-300/70 normal-case",
                    "hover:border-primary/30 hover:bg-primary/5",
                  )}
                >
                  <LogIn className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  <span className="hidden sm:inline">Sign in</span>
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary btn-sm gap-1.5 rounded-full border-0 px-3 shadow-lg shadow-primary/25 normal-case sm:px-4"
                >
                  <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  <span className="hidden sm:inline">Register</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="border-t border-base-300/50 bg-base-200/20 px-0 py-2 md:hidden">
          <SearchBox />
        </div>
      </div>
    </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-[60] bg-base-content/25 backdrop-blur-[2px] lg:hidden"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMobile}
            />
            <motion.aside
              id="site-mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Main navigation"
              className="fixed inset-y-0 left-0 z-[70] flex w-[min(100vw-2.5rem,20rem)] flex-col border-r border-base-300/80 bg-base-100/98 shadow-2xl backdrop-blur-xl lg:hidden"
              initial={reduceMotion ? false : { x: "-105%" }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: "-105%" }}
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 320, damping: 32 }
              }
            >
              <div className="border-b border-base-300/60 px-4 py-3">
                <p className="font-display text-sm font-bold text-base-content/90">
                  {brandCopy.name}
                </p>
                <p className="text-xs text-base-content/50">Menu</p>
              </div>
              <nav
                className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3"
                aria-label="Mobile primary"
              >
                <MobileRow
                  href="/browse"
                  label="Browse"
                  icon={LayoutGrid}
                  active={isPathActive(pathname, "/browse")}
                  onNavigate={closeMobile}
                />
                <MobileRow
                  href="/companies"
                  label="Suppliers"
                  icon={Building2}
                  active={isPathActive(pathname, "/companies")}
                  onNavigate={closeMobile}
                />
                {categories.length > 0 && (
                  <div className="rounded-xl border border-base-300/60 bg-base-200/20 py-1">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-base-content/85 hover:bg-base-200/60"
                      aria-expanded={mobileCatsOpen}
                      onClick={() => setMobileCatsOpen((o) => !o)}
                    >
                      <span className="flex items-center gap-3">
                        <FolderTree
                          className="h-5 w-5 shrink-0 text-secondary"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Categories
                      </span>
                      <motion.span
                        animate={{ rotate: mobileCatsOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown
                          className="h-4 w-4 opacity-60"
                          aria-hidden
                        />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {mobileCatsOpen && (
                        <motion.div
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden border-t border-base-300/50"
                        >
                          <div className="p-2">
                            <label className="relative block">
                              <Search
                                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              <input
                                type="search"
                                value={mobileCatQuery}
                                onChange={(e) => setMobileCatQuery(e.target.value)}
                                placeholder="Search categories…"
                                className="input input-sm h-9 w-full rounded-lg border-base-300/80 bg-base-100 pl-9 text-sm placeholder:text-base-content/40"
                              />
                            </label>
                          </div>
                          <ul className="max-h-52 space-y-0.5 overflow-y-auto overscroll-contain px-2 pb-2">
                            <li>
                              <Link
                                href="/browse"
                                onClick={closeMobile}
                                className="block rounded-lg px-2 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200/80"
                              >
                                All categories
                              </Link>
                            </li>
                            {filteredMobileCategories.map((c) => (
                              <li key={c.id}>
                                <Link
                                  href={`/browse?category=${encodeURIComponent(c.id)}`}
                                  onClick={closeMobile}
                                  className="block rounded-lg px-2 py-2 text-sm text-base-content/80 hover:bg-base-200/80 hover:text-primary"
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                          {filteredMobileCategories.length === 0 && (
                            <p className="px-3 pb-3 text-center text-xs text-base-content/50">
                              No matches.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </nav>

              <div className="border-t border-base-300/60 p-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-xl bg-base-200/50 p-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/35 via-secondary/25 to-accent/30 text-sm font-bold text-primary">
                        {avatarInitials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-base-content/55">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <p className="px-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-base-content/45">
                      Your account
                    </p>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={dashHref}
                        onClick={closeMobile}
                        className="btn btn-ghost btn-sm h-auto min-h-0 justify-start gap-2 rounded-xl border border-base-300/50 py-2.5 normal-case"
                      >
                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                        Dashboard
                      </Link>
                      {user.role === "merchant" && (
                        <>
                          <Link
                            href="/merchant/cart"
                            onClick={closeMobile}
                            className="btn btn-ghost btn-sm h-auto min-h-0 justify-start gap-2 rounded-xl border border-base-300/50 py-2.5 normal-case"
                          >
                            <ShoppingCart className="h-4 w-4 shrink-0" />
                            Cart
                          </Link>
                          <Link
                            href="/merchant/orders"
                            onClick={closeMobile}
                            className="btn btn-ghost btn-sm h-auto min-h-0 justify-start gap-2 rounded-xl border border-base-300/50 py-2.5 normal-case"
                          >
                            <ClipboardList className="h-4 w-4 shrink-0" />
                            Orders
                          </Link>
                        </>
                      )}
                      <Link
                        href="/notifications"
                        onClick={closeMobile}
                        className="btn btn-ghost btn-sm h-auto min-h-0 justify-start gap-2 rounded-xl border border-base-300/50 py-2.5 normal-case sm:hidden"
                      >
                        <Bell className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                        Notifications
                      </Link>
                    </div>
                    <SignOutButton className="btn btn-outline btn-error btn-sm w-full justify-center gap-2 rounded-xl border-error/40 normal-case" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={closeMobile}
                      className="btn btn-ghost btn-sm w-full justify-center gap-2 rounded-xl border border-base-300/70 normal-case"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobile}
                      className="btn btn-primary btn-sm w-full justify-center gap-2 rounded-xl normal-case shadow-lg shadow-primary/20"
                    >
                      <UserPlus className="h-4 w-4" />
                      Create account
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
