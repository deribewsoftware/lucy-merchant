import {
  HiOutlineFingerPrint,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";
import { AdminVerificationsDashboard } from "@/components/admin-verifications-dashboard";
import { listCompanies } from "@/lib/db/catalog";
import { listPendingNationalIdUsers } from "@/lib/db/users";
import { requireStaffPagePermission } from "@/lib/server/require-staff-page";

export default async function AdminVerificationsPage() {
  await requireStaffPagePermission("companies:verify", "/admin/verifications");

  const pendingUsers = listPendingNationalIdUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    nationalIdFan: u.nationalIdFan,
    nationalIdName: u.nationalIdName,
    nationalIdFrontImage: u.nationalIdFrontImage,
    nationalIdBackImage: u.nationalIdBackImage,
    nationalIdCity: u.nationalIdCity,
    nationalIdSubcity: u.nationalIdSubcity,
    nationalIdWoreda: u.nationalIdWoreda,
    nationalIdPhoneOnId: u.nationalIdPhoneOnId,
    nationalIdAddressLine: u.nationalIdAddressLine,
    nationalIdSubmittedAt: u.nationalIdSubmittedAt,
  }));

  const pendingCompanies = listCompanies().filter(
    (c) => !c.isVerified && c.verificationStatus !== "rejected",
  );
  const rejectedCompanies = listCompanies().filter(
    (c) => c.verificationStatus === "rejected",
  );

  return (
    <div>
      <header className="mb-2 flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <HiOutlineFingerPrint className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Verification Center
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60">
              Review Fayda (Ethiopian Digital ID) submissions and company registrations.
              Process during business hours (Mon–Fri, 9 AM – 5 PM EAT).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning ring-1 ring-warning/20">
            <HiOutlineFingerPrint className="h-3.5 w-3.5" />
            {pendingUsers.length} Fayda submission{pendingUsers.length !== 1 ? "s" : ""} pending
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
            <HiOutlineBuildingOffice2 className="h-3.5 w-3.5" />
            {pendingCompanies.length} compan{pendingCompanies.length !== 1 ? "ies" : "y"} pending
          </span>
        </div>
      </header>

      <AdminVerificationsDashboard
        pendingUsers={pendingUsers}
        pendingCompanies={pendingCompanies}
        rejectedCompanies={rejectedCompanies}
      />
    </div>
  );
}
