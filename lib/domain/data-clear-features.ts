/**
 * Super-admin “clear data” feature list (System → Data management).
 * Keep in sync with `lib/server/clear-feature-data.ts`.
 */
export const DATA_CLEAR_FEATURES = [
  {
    id: "all",
    title: "All data (full reset)",
    description:
      "Clears categories, companies, products, orders, payments, carts, reviews, comments, chat, notifications, presence, and the admin audit log. Removes merchant and supplier accounts. Resets system settings to defaults. Administrator accounts (admin / system administrator) are kept.",
    confirmMessage:
      "Erase ALL application data at once? Merchant and supplier accounts will be removed. Staff administrators stay signed in. This cannot be undone.",
  },
  {
    id: "catalog",
    title: "Catalog",
    description:
      "Categories, supplier companies, and product listings. Empty categories may auto-seed two starter categories on next use.",
    confirmMessage:
      "Delete all categories, companies, and products? This cannot be undone.",
  },
  {
    id: "commerce",
    title: "Orders & payments",
    description: "Orders, payment records, and shopping carts.",
    confirmMessage:
      "Delete all orders, payments, and carts? This cannot be undone.",
  },
  {
    id: "reviews",
    title: "Reviews & comments",
    description: "Company reviews, product reviews, and product comments.",
    confirmMessage:
      "Delete all reviews and comments? This cannot be undone.",
  },
  {
    id: "chat",
    title: "Order chat",
    description: "Messages attached to orders.",
    confirmMessage: "Delete all order chat messages? This cannot be undone.",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "In-app notification feed for users.",
    confirmMessage: "Delete all notifications? This cannot be undone.",
  },
  {
    id: "presence",
    title: "Presence",
    description: "Last-activity timestamps used for online indicators.",
    confirmMessage: "Clear all presence data? This cannot be undone.",
  },
  {
    id: "audit",
    title: "Admin audit log",
    description: "Staff action history in the audit trail.",
    confirmMessage:
      "Delete the entire admin audit log? This cannot be undone.",
  },
  {
    id: "users",
    title: "Merchant & supplier accounts",
    description:
      "Removes merchant and supplier accounts only. Administrator accounts (admin and system administrator) are kept.",
    confirmMessage:
      "Delete all merchant and supplier user accounts? Staff administrators will be kept. This cannot be undone.",
  },
  {
    id: "system",
    title: "System defaults",
    description:
      "Resets commission, posting points, featured pricing, and related flags to installation defaults (does not remove other data).",
    confirmMessage:
      "Reset system configuration to default values? Other data is not removed.",
  },
] as const;

export type DataClearFeatureId = (typeof DATA_CLEAR_FEATURES)[number]["id"];

export const DATA_CLEAR_FEATURE_IDS: DataClearFeatureId[] =
  DATA_CLEAR_FEATURES.map((f) => f.id);

export function isDataClearFeatureId(
  v: string,
): v is DataClearFeatureId {
  return DATA_CLEAR_FEATURE_IDS.includes(v as DataClearFeatureId);
}
