import type { Metadata } from "next";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { brandCopy } from "@/lib/brand/copy";
import { requireStaffSession } from "@/lib/server/require-staff-page";

export const metadata: Metadata = {
  title: `Admin settings | ${brandCopy.name}`,
  description:
    "Staff profile, email notifications, appearance, presence, portal access, and security.",
};

export default async function AdminSettingsPage() {
  await requireStaffSession("/admin/settings");

  return (
    <div className="space-y-6">
      <AccountSettingsForm portal="staff" />
    </div>
  );
}
