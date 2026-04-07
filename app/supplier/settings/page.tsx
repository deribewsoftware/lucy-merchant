import type { Metadata } from "next";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { brandCopy } from "@/lib/brand/copy";

export const metadata: Metadata = {
  title: `Supplier settings | ${brandCopy.name}`,
  description:
    "Profile, email notifications, appearance, presence, and security for your supplier account.",
};

export default function SupplierSettingsPage() {
  return (
    <div className="space-y-6">
      <AccountSettingsForm portal="supplier" />
    </div>
  );
}
