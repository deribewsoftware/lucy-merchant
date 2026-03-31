import { Suspense } from "react";
import { PortalNoticeBanner } from "@/components/portal-notice-banner";

/**
 * Mirrors portal layouts: preserves `?notice=wrong_portal` / `staff_only` when opening
 * notifications from the global header after a redirect.
 */
export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <PortalNoticeBanner />
      </Suspense>
      {children}
    </>
  );
}
