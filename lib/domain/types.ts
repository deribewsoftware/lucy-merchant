export type UserRole = "supplier" | "merchant" | "admin";

export type Permission =
  | "admin:dashboard"
  | "companies:verify"
  | "categories:manage"
  | "system:configure"
  | "companies:manage"
  | "products:manage"
  | "orders:supplier"
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
  kind: "order_new" | "order_status" | "chat_message" | "review_company" | "review_product";
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
  | "pending"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "completed"
  | "rejected";

export type OrderItem = CartItem;

export type Order = {
  id: string;
  merchantId: string;
  items: OrderItem[];
  totalPrice: number;
  deliveryLocation: string;
  status: OrderStatus;
  commissionAmount: number;
  paymentStatus: "pending" | "paid" | "failed";
  paymentMethod?: "cod" | "bank_transfer";
  createdAt: string;
};

export type SystemConfig = {
  postProductPoints: number;
  orderCommissionPercent: number;
  featuredProductCost: number;
  freePostingEnabled: boolean;
  freeCommissionEnabled: boolean;
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
  content: string;
  createdAt: string;
  /** Optional structured negotiation (PDF: negotiate price) */
  kind?: "text" | "price_proposal";
  proposedUnitPrice?: number;
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

/** Payment record per checkout (PDF v2 — COD / bank transfer) */
export type Payment = {
  id: string;
  orderId: string;
  method: "cod" | "bank_transfer";
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
