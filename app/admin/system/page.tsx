import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { AdminSystemForm } from "@/components/admin-system-form";
import { getSystemConfig } from "@/lib/db/catalog";
import { requireStaffPagePermission } from "@/lib/server/require-staff-page";

export default async function AdminSystemPage() {
  await requireStaffPagePermission("system:configure", "/admin/system");

  const config = getSystemConfig();
  return (
    <div>
      <header className="mb-2 flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <HiOutlineCog6Tooth className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              System configuration
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60">
              Tune order commission, posting points, featured listing pricing,
              and promotional overrides for the whole platform.
            </p>
          </div>
        </div>
      </header>
      <AdminSystemForm initial={config} />
    </div>
  );
}
