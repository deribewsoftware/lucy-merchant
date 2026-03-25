/**
 * Visual “logo” treatment for platform bank rows — gradient monogram (no image assets).
 */
const GRADIENT_BY_ID: Record<string, string> = {
  cbe: "bg-gradient-to-br from-emerald-600 to-teal-800",
  awash: "bg-gradient-to-br from-amber-500 to-orange-700",
  abyssinia: "bg-gradient-to-br from-rose-600 to-red-800",
  dashen: "bg-gradient-to-br from-blue-600 to-indigo-800",
  "oromia-coop": "bg-gradient-to-br from-lime-600 to-green-800",
  wegagen: "bg-gradient-to-br from-cyan-600 to-blue-800",
  united: "bg-gradient-to-br from-violet-600 to-purple-900",
  nib: "bg-gradient-to-br from-sky-500 to-blue-800",
  zemen: "bg-gradient-to-br from-fuchsia-600 to-pink-900",
  bunna: "bg-gradient-to-br from-amber-700 to-yellow-900",
  berhan: "bg-gradient-to-br from-orange-600 to-red-900",
  addis: "bg-gradient-to-br from-teal-600 to-cyan-900",
  lion: "bg-gradient-to-br from-yellow-500 to-amber-800",
  abay: "bg-gradient-to-br from-blue-500 to-slate-800",
  enat: "bg-gradient-to-br from-pink-500 to-rose-800",
  oromia: "bg-gradient-to-br from-green-600 to-emerald-900",
  debub: "bg-gradient-to-br from-indigo-600 to-slate-900",
  goh: "bg-gradient-to-br from-stone-500 to-neutral-800",
  siinqee: "bg-gradient-to-br from-teal-500 to-emerald-900",
  hibret: "bg-gradient-to-br from-red-600 to-rose-900",
  ahadu: "bg-gradient-to-br from-orange-500 to-amber-900",
  amhara: "bg-gradient-to-br from-yellow-600 to-orange-900",
  telebirr: "bg-gradient-to-br from-green-500 to-emerald-700",
};

const SHORT_BY_ID: Record<string, string> = {
  cbe: "CBE",
  awash: "AW",
  abyssinia: "BoA",
  dashen: "DB",
  "oromia-coop": "COOP",
  wegagen: "WG",
  united: "UB",
  nib: "NIB",
  zemen: "ZB",
  bunna: "BN",
  berhan: "BR",
  addis: "AIS",
  lion: "LIB",
  abay: "AB",
  enat: "EN",
  oromia: "OB",
  debub: "DG",
  goh: "GB",
  siinqee: "SQ",
  hibret: "HB",
  ahadu: "AH",
  amhara: "AM",
  telebirr: "TB",
};

export function platformBankMonogramGradient(bankId: string): string {
  return GRADIENT_BY_ID[bankId] ?? "bg-gradient-to-br from-slate-600 to-slate-900";
}

export function platformBankMonogramShort(bankId: string, bankName: string): string {
  if (SHORT_BY_ID[bankId]) return SHORT_BY_ID[bankId];
  const words = bankName.replace(/[()]/g, " ").trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase().slice(0, 3);
  }
  return bankName.slice(0, 3).toUpperCase();
}
