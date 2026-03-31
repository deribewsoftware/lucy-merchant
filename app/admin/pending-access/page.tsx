import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineBellAlert,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineKey,
  HiOutlineShieldExclamation,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { requireStaffSession } from "@/lib/server/require-staff-page";
import { PendingAccessActions } from "@/components/pending-access-actions";

export default async function AdminPendingAccessPage() {
  await requireStaffSession("/admin/pending-access");

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12 animate-in fade-in duration-500">
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-base-100 to-violet-500/[0.06] p-8 shadow-lg shadow-amber-500/5 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-200">
            <HiOutlineSparkles className="h-3.5 w-3.5" />
            No permissions yet
          </div>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-300">
              <HiOutlineShieldExclamation className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Your admin account is waiting for access
              </h1>
              <p className="text-base leading-relaxed text-base-content/80">
                You signed in successfully, but a <strong className="text-base-content">system administrator</strong>{" "}
                has not granted any capabilities yet. Inside the admin area, permissions control what you can
                open — dashboard, orders, moderation, and more — each is a separate toggle for super admins.
              </p>
              <p className="flex flex-wrap items-center gap-2 text-sm text-base-content/65">
                <HiOutlineClock className="h-4 w-4 shrink-0" />
                Ask your org&apos;s system admin to open{" "}
                <strong className="text-base-content">Team &amp; roles</strong> and assign what you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-base-300/80 bg-base-200/25 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiOutlineBellAlert className="h-5 w-5" />
          </div>
          <h2 className="mt-3 font-semibold text-base-content">Ping system administrators</h2>
          <p className="mt-2 text-sm leading-relaxed text-base-content/70">
            We can email and notify all system administrators that you need access (throttled so they
            aren&apos;t spammed). Use the button below anytime.
          </p>
        </div>
        <div className="rounded-2xl border border-base-300/80 bg-base-200/25 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <HiOutlineArrowPath className="h-5 w-5" />
          </div>
          <h2 className="mt-3 font-semibold text-base-content">After you&apos;re granted access</h2>
          <p className="mt-2 text-sm leading-relaxed text-base-content/70">
            Refresh or open the admin overview — your sidebar will show only the sections you&apos;re allowed
            to use.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-primary/20 bg-base-100 p-6 shadow-inner sm:p-8">
        <div className="flex flex-wrap items-start gap-3">
          <HiOutlineEnvelope className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-base-content">Send a request now</h2>
            <p className="mt-1 text-sm text-base-content/70">
              Delivers an <strong className="text-base-content">in-app notification</strong> to every system
              administrator, plus email when mail is configured.
            </p>
            <div className="mt-6">
              <PendingAccessActions />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-base-300/80 bg-base-200/20 px-4 py-8 text-center sm:px-8">
        <HiOutlineKey className="h-8 w-8 text-base-content/40" />
        <p className="max-w-md text-sm text-base-content/70">
          You can still update your password, name, and email preferences — useful while you wait.
        </p>
        <Link
          href="/admin/settings"
          className="btn btn-outline btn-sm gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <HiOutlineKey className="h-4 w-4" />
          Open account settings
        </Link>
      </div>
    </div>
  );
}
