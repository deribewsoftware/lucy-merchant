/**
 * Dual platform commission: merchants pay a merchant (buyer) fee; suppliers pay a
 * supplier fee. When a fee applies, both must be paid to the platform and recorded
 * before the buyer can mark the order completed.
 */

export const ORDER_COMPLETION_COMMISSION_RULE =
  "Merchants owe a merchant platform commission fee; suppliers owe a supplier platform commission fee. When either fee applies, both must be paid to the platform and recorded before the order can be completed.";

export const MERCHANT_COMMISSION_SUSPENSION_BANNER =
  "Account suspended — unpaid merchant platform commission on a delivered order. Pay the platform and record it on that order to restore browsing, cart, and checkout.";

export const SUPPLIER_COMMISSION_SUSPENSION_BANNER =
  "Account suspended — unpaid supplier platform commission on a delivered order. Pay the platform and record it on that order to restore posting and editing listings.";

export const MERCHANT_COMMISSION_HOLD_INLINE =
  "Account suspended: merchant platform commission unpaid. Browsing and checkout stay blocked until you pay the platform and record it on the order.";

export const SUPPLIER_COMMISSION_HOLD_INLINE =
  "Account suspended: supplier platform commission unpaid. New listing posts and edits stay blocked until you pay the platform and record it on the order.";

export const MERCHANT_ORDERS_HOLD_EXPLAINER_TITLE =
  "Account suspended — settle your merchant platform commission here";

export const MERCHANT_ORDERS_HOLD_EXPLAINER_BODY =
  "Open a delivered order with an unpaid merchant fee, pay the platform, then use “I have paid commission — record now.” The supplier must also pay and record their supplier fee (when it applies) before you can complete the order.";

export const SUPPLIER_ORDERS_HOLD_EXPLAINER_TITLE =
  "Account suspended — settle your supplier platform commission here";

export const SUPPLIER_ORDERS_HOLD_EXPLAINER_BODY =
  "Open a delivered order with an unpaid supplier fee, transfer to the platform, then use “I have paid — record supplier commission.” The buyer must pay and record their merchant fee first when it applies; both sides must be settled before the order can be completed.";

export const API_MERCHANT_COMMISSION_SUSPENDED =
  "Account suspended until outstanding merchant platform commission is paid and recorded on delivered orders. Open Orders to settle.";

export const API_SUPPLIER_COMMISSION_SUSPENDED =
  "Account suspended until outstanding supplier platform commission is paid and recorded on delivered orders. Open Orders to settle.";
