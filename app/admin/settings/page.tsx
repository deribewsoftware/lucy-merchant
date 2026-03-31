import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { requireStaffSession } from "@/lib/server/require-staff-page";

export default async function AdminSettingsPage() {
  await requireStaffSession("/admin/settings");

  return (
    <div className="space-y-6">
      <AccountSettingsForm />
    </div>
  );
}
