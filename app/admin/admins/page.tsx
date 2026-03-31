import { HiOutlineShieldCheck, HiOutlineSparkles } from "react-icons/hi2";
import { AdminTeamPanel } from "@/components/admin-team-panel";
import { requireStaffPagePermission } from "@/lib/server/require-staff-page";

export default async function AdminTeamPage() {
  await requireStaffPagePermission("system:manage-admins", "/admin/admins");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="relative overflow-hidden rounded-2xl border border-base-300/80 bg-gradient-to-br from-base-200/40 via-base-100 to-accent/5 p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 text-primary shadow-lg shadow-primary/10">
              <HiOutlineShieldCheck className="h-8 w-8" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <HiOutlineSparkles className="h-3.5 w-3.5" />
                System administrators only
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                Team &amp; roles
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-base-content/70">
                Invite administrators, promote trusted users to system administrator, and
                assign capabilities with an explicit permission list. New admins start with
                no access until you grant permissions here — they can request access from
                the pending screen and system administrators receive email and in-app
                alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <AdminTeamPanel />
    </div>
  );
}
