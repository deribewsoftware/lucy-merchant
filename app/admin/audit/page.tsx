import { HiOutlineShieldCheck } from "react-icons/hi2";
import { AdminAuditTable } from "@/components/admin-audit-table";
import { requireStaffPagePermission } from "@/lib/server/require-staff-page";

export default async function AdminAuditPage() {
  await requireStaffPagePermission("system:audit-read", "/admin/audit");

  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <HiOutlineShieldCheck className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Audit log
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60">
              Sign-ins and administrative actions with actor, time, and context.
            </p>
          </div>
        </div>
      </header>
      <AdminAuditTable />
    </div>
  );
}
