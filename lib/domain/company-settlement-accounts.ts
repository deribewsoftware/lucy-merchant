import type { Company, CompanySettlementBankAccount } from "@/lib/domain/types";

export const MAX_COMPANY_SETTLEMENT_BANK_ACCOUNTS = 10;

export type { CompanySettlementBankAccount };

/** Minimal company shape for reading settlement rows (avoids requiring full `Company` at call sites). */
export type CompanySettlementSource = Pick<
  Company,
  | "id"
  | "settlementBankAccounts"
  | "settlementBankName"
  | "settlementAccountName"
  | "settlementAccountNumber"
>;

function newLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `acc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Accounts for bank-transfer checkout: prefers `settlementBankAccounts`, else a single row from legacy fields.
 */
export function getCompanySettlementAccounts(
  company: CompanySettlementSource,
): CompanySettlementBankAccount[] {
  const arr = company.settlementBankAccounts;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr
      .filter((a) => a && typeof a === "object")
      .map((a) => ({
        id: String((a as CompanySettlementBankAccount).id ?? "").trim() || newLocalId(),
        bankName: String((a as CompanySettlementBankAccount).bankName ?? "").trim(),
        accountName: String((a as CompanySettlementBankAccount).accountName ?? "").trim(),
        accountNumber: String((a as CompanySettlementBankAccount).accountNumber ?? "").trim(),
      }))
      .filter((a) => a.bankName || a.accountNumber || a.accountName);
  }
  const bank = (company.settlementBankName ?? "").trim();
  const an = (company.settlementAccountName ?? "").trim();
  const num = (company.settlementAccountNumber ?? "").trim();
  if (bank || an || num) {
    return [
      {
        id: `legacy-${company.id}`,
        bankName: bank,
        accountName: an,
        accountNumber: num,
      },
    ];
  }
  return [];
}
