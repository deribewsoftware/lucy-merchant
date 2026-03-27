export type UserRole = "supplier" | "merchant" | "admin";

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export type Permission =
  | "admin:dashboard"
  | "companies:verify"
  | "categories:manage"
  | "system:configure"
  | "companies:manage"
  | "products:manage"
  | "orders:supplier"
  | "orders:complete"
  | "market:browse"
  | "cart:manage"
  | "orders:merchant"
  | "reviews:create";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  /** Supplier balance for posting products when points are enabled */
  points?: number;
  createdAt: string;
  /** When `false`, merchant/supplier must verify email before login. Omitted = legacy verified. */
  emailVerified?: boolean;
  emailVerificationOtpHash?: string;
  emailVerificationOtpExpiresAt?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: string;
  /** Admin-only: subtract permissions from the default admin set (e.g. revoke order completion). */
  adminPermissionDeny?: Permission[];
  /** National ID verification */
  nationalIdStatus?: VerificationStatus;
  nationalIdNumber?: string;
  nationalIdName?: string;
  nationalIdFrontImage?: string;
  nationalIdBackImage?: string;
  nationalIdSubmittedAt?: string;
  nationalIdReviewedAt?: string;
  nationalIdRejectionReason?: string;
  nationalIdReviewedBy?: string;
};

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

export type Company = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  logo?: string;
  licenseDocument?: string;
  /** Optional HQ / registered address from Google Places */
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
  ratingAverage: number;
  totalReviews: number;
  createdAt: string;
  /** Shown to buyers for bank transfer checkout — pay supplier directly */
  settlementBankName?: string;
  settlementAccountName?: string;
  settlementAccountNumber?: string;
  /** Company verification — TIN and Trade License */
  tinNumber?: string;
  tradeLicenseNumber?: string;
  tradeLicenseDocument?: string;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type Product = {
  id: string;
  companyId: string;
  name: string;
  description: string;
  categoryId: string;
  tags: string[];
  price: number;
  /** Optional higher “was” price — shown struck through when greater than `price` */
  compareAtPrice?: number;
  availableQuantity: number;
  minOrderQuantity: number;
  maxDeliveryQuantity: number;
  deliveryTime: string;
  /** Pieces per carton — optional; enables min-carton display from MOQ */
  itemsPerCarton?: number;
  /** Pieces per rim (layer) — optional */
  itemsPerRim?: number;
  /** Pieces counted as one “dozen” (often 12) — optional */
  itemsPerDozen?: number;
  totalOrdersCount: number;
  averageRating: number;
  createdAt: string;
  /** Public image URL (PDF product detail imagery) */
  imageUrl?: string;
  /** Paid boost — higher visibility in lists (PDF featured listings) */
  isFeatured?: boolean;
  /** Page views — PDF trending / engagement signal */
  viewCount?: number;
  /** Optional ship-from / service region (PDF: location filter) */
  shipFromRegion?: string;
};

/** In-app notification (PDF §16 notification system) */
export type NotificationRecord = {
  id: string;
  userId: string;
  kind:
    | "order_new"
    | "order_status"
    | "order_admin"
    | "commission_due"
    | "chat_message"
    | "review_company"
    | "review_product"
    | "verification_status";
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  companyId: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type Cart = {
  id: string;
  merchantId: string;
  items: CartItem[];
  totalAmount: number;
  updatedAt: string;
};

export type OrderStatus =
  | "awaiting_payment"
  | "awaiting_bank_review"
  | "pending"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "completed"
  | "rejected";

export type OrderItem = CartItem;

/** cod = cash to supplier on delivery; bank_transfer = transfer to supplier’s company account */
export type PaymentMethod =
  | "cod"
  | "bank_transfer"
  | "stripe"
  | "chapa"
  | "telebirr";

export type Order = {
  id: string;
  merchantId: string;
  items: OrderItem[];
  totalPrice: number;
  deliveryLocation: string;
  status: OrderStatus;
  /** Merchant (buyer) platform commission fee → platform: % of order total from system config. */
  commissionAmount: number;
  /** Supplier platform commission fee → platform: % of this order’s line subtotal (same supplier per order). */
  supplierCommissionAmount?: number;
  paymentStatus: "pending" | "paid" | "failed";
  paymentMethod?: PaymentMethod;
  /** @deprecated Legacy platform bank choice — new checkouts pay supplier directly */
  platformBankId?: string;
  /** Relative public path e.g. /uploads/order-receipts/xxx.jpg */
  bankProofImagePath?: string;
  /** Stripe session, Chapa tx_ref, etc. */
  externalPaymentRef?: string;
  /** Stripe/Chapa webhook received — admin must confirm before suppliers see the order. */
  gatewayPaymentCapturedAt?: string;
  /** Amount recorded as commission received by the platform (mirrors commission when settled) */
  supplierNetPayoutEtb?: number;
  /** Legacy: when supplier/admin recorded platform commission before merchant-paid flow */
  supplierPayoutRecordedAt?: string;
  /** When the merchant recorded paying their platform commission (buyer → platform). */
  merchantCommissionPaidAt?: string;
  /** Screenshot / receipt uploaded when merchant recorded commission (public path). */
  merchantCommissionProofImagePath?: string;
  /** When the supplier recorded paying their platform commission (supplier → platform). */
  supplierCommissionPaidAt?: string;
  /** Screenshot / receipt uploaded when supplier recorded commission (public path). */
  supplierCommissionProofImagePath?: string;
  /**
   * When the order became delivered: deadline to pay platform commission before
   * suspension (see SystemConfig.commissionPaymentGraceHours). Set automatically on delivery.
   */
  commissionDeadlineAt?: string;
  /** Admin confirmed they reviewed commission payment screenshots before completing the order. */
  adminCommissionProofsAcknowledgedAt?: string;
  adminCommissionProofsAcknowledgedBy?: string;
  createdAt: string;
};

export type SystemConfig = {
  postProductPoints: number;
  /** Merchant platform commission fee: % of order total → platform (buyer pays; both fees must be settled before completion when they apply). */
  orderCommissionPercent: number;
  /** Supplier platform commission fee: % of supplier’s line subtotal on each order → platform */
  supplierOrderCommissionPercent: number;
  featuredProductCost: number;
  freePostingEnabled: boolean;
  /** Waives merchant order commission on new checkouts */
  freeCommissionEnabled: boolean;
  /** Waives supplier order commission on new checkouts */
  freeSupplierCommissionEnabled: boolean;
  /**
   * Hours after delivery before unpaid platform commission triggers account suspension
   * (per side, when a fee applies). Default 72.
   */
  commissionPaymentGraceHours: number;
};

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
};

/** Order-scoped negotiation chat (PDF: linked to order) */
export type ChatMessage = {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  /** Set for new messages; older rows may omit and rely on API resolution */
  senderRole?: UserRole;
  content: string;
  createdAt: string;
  /** Optional structured negotiation (PDF: negotiate price) */
  kind?: "text" | "price_proposal" | "image";
  proposedUnitPrice?: number;
  /** Public path e.g. /uploads/order-chat/… */
  imageUrl?: string;
};

/** Company review after completed order (verified purchase) */
export type CompanyReview = {
  id: string;
  companyId: string;
  merchantId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

/** Product-level review after completed order (PDF v2 — verified purchase) */
export type ProductReview = {
  id: string;
  productId: string;
  merchantId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

/** Payment record per checkout */
export type Payment = {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: "pending" | "paid" | "failed";
  amount: number;
  transactionRef?: string;
  createdAt: string;
};

/** Threaded product discussion (optional parentId for replies) */
export type ProductComment = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  comment: string;
  parentId: string | null;
  createdAt: string;
  /** User ids who liked (PDF: comment likes) */
  likedBy?: string[];
};
