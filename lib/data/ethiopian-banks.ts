/**
 * Platform receiving accounts for Ethiopian bank transfers.
 * Replace placeholder account numbers and QR URLs with your real Lucy Merchant settlement details.
 */
export type PlatformBankAccount = {
  id: string;
  bankName: string;
  branch?: string;
  accountName: string;
  accountNumber: string;
  /** Optional: URL to a hosted QR / Telebirr receipt image for this account */
  qrReceiptUrl?: string;
};

export const PLATFORM_BANK_ACCOUNTS: PlatformBankAccount[] = [
  {
    id: "cbe",
    bankName: "Commercial Bank of Ethiopia (CBE)",
    branch: "Main — Addis Ababa",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
    qrReceiptUrl: undefined,
  },
  {
    id: "awash",
    bankName: "Awash Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "0130XXXXXXX",
  },
  {
    id: "abyssinia",
    bankName: "Bank of Abyssinia",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1550XXXXXXX",
  },
  {
    id: "dashen",
    bankName: "Dashen Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "9010XXXXXXX",
  },
  {
    id: "oromia-coop",
    bankName: "Cooperative Bank of Oromia",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "wegagen",
    bankName: "Wegagen Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "0110XXXXXXX",
  },
  {
    id: "united",
    bankName: "United Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "nib",
    bankName: "Nib International Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "zemen",
    bankName: "Zemen Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "bunna",
    bankName: "Bunna International Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "berhan",
    bankName: "Berhan International Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "addis",
    bankName: "Addis International Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "lion",
    bankName: "Lion International Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "abay",
    bankName: "Abay Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "enat",
    bankName: "Enat Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "oromia",
    bankName: "Oromia Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "debub",
    bankName: "Debub Global Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "goh",
    bankName: "Goh Betoch Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "siinqee",
    bankName: "Siinqee Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "hibret",
    bankName: "Hibret Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "ahadu",
    bankName: "Ahadu Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "amhara",
    bankName: "Amhara Bank",
    accountName: "Lucy Merchant Platform PLC",
    accountNumber: "1000XXXXXXX",
  },
  {
    id: "telebirr",
    bankName: "Telebirr (mobile wallet — platform settlement)",
    accountName: "Lucy Merchant Platform",
    accountNumber: "09XX XXX XXX",
    qrReceiptUrl: undefined,
  },
];

/** Sorted bank names for supplier settlement dropdowns (Ethiopian banks + Telebirr). */
export const ETHIOPIAN_BANK_NAMES_FOR_SUPPLIER: string[] = [
  ...PLATFORM_BANK_ACCOUNTS.map((b) => b.bankName),
].sort((a, b) => a.localeCompare(b, "en"));

export function getPlatformBankById(id: string): PlatformBankAccount | undefined {
  return PLATFORM_BANK_ACCOUNTS.find((b) => b.id === id);
}
