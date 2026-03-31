import { SupplierCompaniesSubnav } from "@/components/supplier-companies-subnav";

export default function SupplierCompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <SupplierCompaniesSubnav />
      {children}
    </div>
  );
}
