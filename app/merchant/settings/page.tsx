import type { Metadata } from "next";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { brandCopy } from "@/lib/brand/copy";

export const metadata: Metadata = {
  title: `Merchant settings | ${brandCopy.name}`,
  description:
    "Profile, email notifications, appearance, presence, and security for your merchant account.",
};

export default function MerchantSettingsPage() {
  return (
    <div className="space-y-6">
      <AccountSettingsForm portal="merchant" />
    </div>
  );
}
