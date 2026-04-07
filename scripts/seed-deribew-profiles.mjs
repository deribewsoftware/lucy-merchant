/**
 * Enriches Deribew team accounts (run after seed:deribew-users) and adds
 * two Ethiopian supplier companies registered to deribewshimels4@gmail.com,
 * with sample catalog products across categories, plus demo orders (merchant:
 * deribew.et@gmail.com), payments, company/product reviews, supplier notification,
 * and one order-chat message.
 *
 * Run:  node scripts/seed-deribew-profiles.mjs
 * Or:   npm run seed:deribew-profiles
 * Then: npm run sync:deploy-seed
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");

const EMAIL = {
  super: "deribewsoftware@gmail.com",
  adminTech: "deribew.tech@gmail.com",
  adminSoft: "deri.software@gmail.com",
  supplier: "deribewshimels4@gmail.com",
  merchant: "deribew.et@gmail.com",
};

/** IDs aligned with seed-demo-data (categories.json). */
const CAT = {
  cement: "20000000-0000-4000-a000-000000000002",
  steel: "20000000-0000-4000-a000-000000000003",
  electrical: "20000000-0000-4000-a000-000000000006",
  fastener: "20000000-0000-4000-a000-000000000007",
  fertilizer: "20000000-0000-4000-a000-000000000009",
  seeds: "20000000-0000-4000-a000-000000000010",
  cropProt: "20000000-0000-4000-a000-00000000000f",
  irrigation: "20000000-0000-4000-a000-000000000011",
};

const CO_BUILD = "30000000-0000-4000-a000-000000000006";
const CO_AGRO = "30000000-0000-4000-a000-000000000007";

const O_DERI_1 = "50000000-0000-4000-a000-000000000005";
const O_DERI_2 = "50000000-0000-4000-a000-000000000006";
const PAY_DERI_1 = "60000000-0000-4000-a000-000000000003";
const PAY_DERI_2 = "60000000-0000-4000-a000-000000000004";
const CR_DERI_1 = "70000000-0000-4000-a000-000000000003";
const CR_DERI_2 = "70000000-0000-4000-a000-000000000004";
const PR_DERI_1 = "80000000-0000-4000-a000-000000000004";
const PR_DERI_2 = "80000000-0000-4000-a000-000000000005";
const N_DERI_SUP = "a0000000-0000-4000-a000-000000000002";
const CHAT_DERI = "b1000000-0000-4000-a000-000000000004";

const P_CE = "40000000-0000-4000-a000-000000000049";
const P_UREA = "40000000-0000-4000-a000-00000000004e";

const IMG = {
  cement:
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
  steel:
    "https://images.unsplash.com/photo-1565194292457-47a49aeeb2f8?w=800&q=80",
  rebar:
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
  electrical:
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80",
  agri: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
  irrigation:
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
};

const LOGO_BUILD =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&h=200&fit=crop&q=80";
const LOGO_AGRO =
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=200&h=200&fit=crop&q=80";

function readJson(name, fallback) {
  const p = path.join(DATA, name);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(name, obj) {
  fs.writeFileSync(
    path.join(DATA, name),
    JSON.stringify(obj, null, 2),
    "utf-8",
  );
  console.log("wrote", name);
}

function main() {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

  const users = readJson("users.json", []);
  if (!Array.isArray(users)) {
    console.error("users.json invalid");
    process.exit(1);
  }

  const byEmail = (e) =>
    users.find((u) => String(u.email).toLowerCase() === e.toLowerCase());

  const sup = byEmail(EMAIL.supplier);
  if (!sup) {
    console.error("Run npm run seed:deribew-users first (supplier not found).");
    process.exit(1);
  }

  const ethiopia = {
    nationalIdStatus: "approved",
    nationalIdFan: "1234567890123456",
    nationalIdName: "Deribew Shimels",
    nationalIdCity: "Addis Ababa",
    nationalIdSubcity: "Bole",
    nationalIdWoreda: "Woreda 03",
    nationalIdAddressLine: "Ethiopia — demo seed profile",
    nationalIdSubmittedAt: new Date().toISOString(),
    nationalIdReviewedAt: new Date().toISOString(),
    nationalIdReviewedBy: byEmail(EMAIL.super)?.id ?? "system",
  };

  const prefs = {
    emailOrderUpdates: true,
    emailReviewsAndComments: true,
    emailChatMirrors: false,
    emailAccountAlerts: true,
  };

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const e = String(u.email).toLowerCase();
    if (!Object.values(EMAIL).some((x) => x.toLowerCase() === e)) continue;

    users[i] = {
      ...u,
      preferences: { ...prefs, ...(u.preferences ?? {}) },
      emailVerified: true,
    };

    if (u.role === "supplier" || u.role === "merchant") {
      users[i] = {
        ...users[i],
        ...ethiopia,
        nationalIdName:
          u.role === "merchant"
            ? "Deribew ET Trading (merchant)"
            : ethiopia.nationalIdName,
      };
    }
  }

  writeJson("users.json", users);

  let companies = readJson("companies.json", []);
  if (!Array.isArray(companies)) companies = [];

  const companyRows = [
    {
      id: CO_BUILD,
      ownerId: sup.id,
      name: "Deribew Industrial & Building Materials PLC",
      description:
        "Wholesale cement, structural steel, and electrical conduit for contractors in Addis Ababa and Oromia. Registered in Ethiopia; stock held at Bole logistics hub. Same-week delivery on confirmed orders.",
      logo: LOGO_BUILD,
      licenseDocument:
        "https://www.example.com/licenses/deribew-trade-license-demo.pdf",
      businessAddress:
        "Bole Subcity, Addis Ababa, Ethiopia — Kirkos trade registration (demo)",
      latitude: 8.9989,
      longitude: 38.7899,
      isVerified: true,
      verificationStatus: "approved",
      tinNumber: "000123456789",
      tradeLicenseNumber: "TL-ADDIS-2019-88421",
      tradeLicenseDocument:
        "https://www.example.com/licenses/deribew-trade-license-demo.pdf",
      ratingAverage: 4.7,
      totalReviews: 18,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      settlementBankName: "Commercial Bank of Ethiopia",
      settlementAccountName: "Deribew Industrial & Building Materials PLC",
      settlementAccountNumber: "1000123456789",
    },
    {
      id: CO_AGRO,
      ownerId: sup.id,
      name: "Awash Valley Agro Supply",
      description:
        "Fertilizer blends, certified seed, and irrigation consumables for farmers and cooperatives in the Great Rift Valley and Eastern Shewa. Agronomist support and cooperative pricing (demo).",
      logo: LOGO_AGRO,
      licenseDocument:
        "https://www.example.com/licenses/awash-agro-license-demo.pdf",
      businessAddress:
        "Adama, Oromia, Ethiopia — Industrial zone (demo)",
      latitude: 8.8875,
      longitude: 39.0293,
      isVerified: true,
      verificationStatus: "approved",
      tinNumber: "000987654321",
      tradeLicenseNumber: "TL-ADAMA-2021-10293",
      tradeLicenseDocument:
        "https://www.example.com/licenses/awash-agro-license-demo.pdf",
      ratingAverage: 4.6,
      totalReviews: 12,
      createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      settlementBankName: "Commercial Bank of Ethiopia",
      settlementAccountName: "Awash Valley Agro Supply",
      settlementAccountNumber: "1000987654321",
    },
  ];

  for (const row of companyRows) {
    const ix = companies.findIndex((c) => c.id === row.id);
    if (ix >= 0) companies[ix] = { ...companies[ix], ...row };
    else companies.push(row);
  }
  writeJson("companies.json", companies);

  const now = new Date().toISOString();
  const baseProduct = (id, companyId, categoryId, rest) => ({
    id,
    companyId,
    categoryId,
    totalOrdersCount: rest.totalOrdersCount ?? 0,
    averageRating: rest.averageRating ?? 4.5,
    createdAt: rest.createdAt ?? now,
    viewCount: rest.viewCount ?? 0,
    ...rest,
  });

  const products = readJson("products.json", []);
  if (!Array.isArray(products)) {
    console.error("products.json invalid");
    process.exit(1);
  }

  const deribewProducts = [
    baseProduct(
      "40000000-0000-4000-a000-000000000049",
      CO_BUILD,
      CAT.cement,
      {
        name: "Portland Cement 50kg — CEM I (Deribew)",
        description:
          "Bagged cement from major Ethiopian producers; batch stickers for QC. Palletized loads available.",
        tags: ["cement", "50kg", "addis"],
        price: 495,
        availableQuantity: 1800,
        minOrderQuantity: 40,
        maxDeliveryQuantity: 600,
        deliveryTime: "3–6 business days",
        shipFromRegion: "Addis Ababa",
        imageUrl: IMG.cement,
        totalOrdersCount: 42,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-00000000004a",
      CO_BUILD,
      CAT.steel,
      {
        name: "Deformed Rebar 10mm × 12m",
        description:
          "Mill test reports per heat; bundled for site delivery across Addis and surrounding towns.",
        tags: ["rebar", "10mm", "steel"],
        price: 98,
        availableQuantity: 6000,
        minOrderQuantity: 250,
        maxDeliveryQuantity: 3000,
        deliveryTime: "2–5 business days",
        shipFromRegion: "Addis Ababa",
        imageUrl: IMG.rebar,
        totalOrdersCount: 88,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-00000000004b",
      CO_BUILD,
      CAT.fastener,
      {
        name: "Welding Electrodes E6013 (5kg pack)",
        description: "General-purpose rutile electrodes for structural and repair work.",
        tags: ["welding", "e6013", "fastener"],
        price: 990,
        availableQuantity: 400,
        minOrderQuantity: 10,
        maxDeliveryQuantity: 120,
        deliveryTime: "3–5 business days",
        shipFromRegion: "Addis Ababa",
        imageUrl: IMG.steel,
        totalOrdersCount: 31,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-00000000004c",
      CO_BUILD,
      CAT.steel,
      {
        name: "Equal Angle Steel 50×50×5mm × 6m",
        description: "Hot-rolled; primer optional; cut-to-length on request (demo).",
        tags: ["angle", "steel", "structural"],
        price: 2950,
        availableQuantity: 220,
        minOrderQuantity: 12,
        maxDeliveryQuantity: 80,
        deliveryTime: "4–7 business days",
        shipFromRegion: "Addis Ababa",
        imageUrl: IMG.steel,
        totalOrdersCount: 19,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-00000000004d",
      CO_BUILD,
      CAT.electrical,
      {
        name: "PVC Conduit 25mm × 3m (heavy duty)",
        description: "Orange HD conduit; 20 pieces per bundle.",
        tags: ["conduit", "pvc", "electrical"],
        price: 195,
        availableQuantity: 4000,
        minOrderQuantity: 100,
        maxDeliveryQuantity: 2000,
        deliveryTime: "3–6 business days",
        shipFromRegion: "Addis Ababa",
        imageUrl: IMG.electrical,
        totalOrdersCount: 54,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-00000000004e",
      CO_AGRO,
      CAT.fertilizer,
      {
        name: "Urea 46%N — 50kg (prilled)",
        description: "Warehouse batch tracking; cooperative pricing tier available.",
        tags: ["urea", "fertilizer", "50kg"],
        price: 2680,
        availableQuantity: 3200,
        minOrderQuantity: 80,
        maxDeliveryQuantity: 1200,
        deliveryTime: "4–8 business days",
        shipFromRegion: "Adama",
        imageUrl: IMG.agri,
        totalOrdersCount: 156,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-00000000004f",
      CO_AGRO,
      CAT.fertilizer,
      {
        name: "NPK 15-15-15 — 50kg",
        description: "Balanced compound for maize and teff rotations in Rift Valley soils.",
        tags: ["npk", "fertilizer", "compound"],
        price: 3250,
        availableQuantity: 2100,
        minOrderQuantity: 60,
        maxDeliveryQuantity: 900,
        deliveryTime: "4–8 business days",
        shipFromRegion: "Adama",
        imageUrl: IMG.agri,
        totalOrdersCount: 98,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-000000000050",
      CO_AGRO,
      CAT.seeds,
      {
        name: "Hybrid Maize Seed — 25kg (certified)",
        description: "Single-cross hybrid; germination certificate per lot.",
        tags: ["maize", "seed", "hybrid"],
        price: 4280,
        availableQuantity: 640,
        minOrderQuantity: 20,
        maxDeliveryQuantity: 200,
        deliveryTime: "5–10 business days",
        shipFromRegion: "Adama",
        imageUrl: IMG.agri,
        totalOrdersCount: 72,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-000000000051",
      CO_AGRO,
      CAT.cropProt,
      {
        name: "Glyphosate 480 SL — 20L drum",
        description:
          "Non-selective systemic herbicide; follow label and local regulations.",
        tags: ["herbicide", "glyphosate", "20l"],
        price: 8350,
        availableQuantity: 90,
        minOrderQuantity: 4,
        maxDeliveryQuantity: 24,
        deliveryTime: "6–12 business days",
        shipFromRegion: "Adama",
        imageUrl: IMG.agri,
        totalOrdersCount: 28,
      },
    ),
    baseProduct(
      "40000000-0000-4000-a000-000000000052",
      CO_AGRO,
      CAT.irrigation,
      {
        name: "Drip Tape 16mm — 0.6m spacing (2500m roll)",
        description: "Thin-wall turbulent flow for row crops and orchards.",
        tags: ["drip", "irrigation", "tape"],
        price: 4350,
        availableQuantity: 95,
        minOrderQuantity: 2,
        maxDeliveryQuantity: 24,
        deliveryTime: "6–10 business days",
        shipFromRegion: "Adama",
        imageUrl: IMG.irrigation,
        totalOrdersCount: 35,
      },
    ),
  ];

  for (const p of deribewProducts) {
    const ix = products.findIndex((x) => x.id === p.id);
    if (ix >= 0) products[ix] = { ...products[ix], ...p };
    else products.push(p);
  }
  writeJson("products.json", products);

  mergeDeribewCommerce({
    merchantId: byEmail(EMAIL.merchant)?.id,
    merchantName: byEmail(EMAIL.merchant)?.name ?? "Deribew ET — Merchant",
    supplierUserId: sup.id,
  });

  console.log(
    "\nDone. Supplier companies (Deribew Shimels):",
    companyRows.map((c) => c.name).join(", "),
  );
  console.log("Products added/updated:", deribewProducts.length);
}

/**
 * Orders, payments, reviews, notification, chat — idempotent by fixed IDs.
 */
function mergeDeribewCommerce({
  merchantId,
  merchantName,
  supplierUserId,
}) {
  if (!merchantId) {
    console.warn("skip commerce seed: merchant email not in users.json");
    return;
  }

  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

  const orderBuild = {
    id: O_DERI_1,
    merchantId,
    items: [
      {
        productId: P_CE,
        companyId: CO_BUILD,
        quantity: 120,
        price: 495,
        subtotal: 59400,
      },
    ],
    totalPrice: 59400,
    deliveryLocation: "Kality Industrial Zone — Gate 4, Addis Ababa",
    status: "completed",
    commissionAmount: 1782,
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    createdAt: daysAgo(18),
  };

  const orderAgro = {
    id: O_DERI_2,
    merchantId,
    items: [
      {
        productId: P_UREA,
        companyId: CO_AGRO,
        quantity: 100,
        price: 2680,
        subtotal: 268000,
      },
    ],
    totalPrice: 268000,
    deliveryLocation: "Adama — Cooperative warehouse, Eastern Shewa",
    status: "in_progress",
    commissionAmount: 8040,
    paymentStatus: "pending",
    paymentMethod: "cod",
    createdAt: daysAgo(4),
  };

  let orders = readJson("orders.json", []);
  if (!Array.isArray(orders)) orders = [];
  for (const row of [orderBuild, orderAgro]) {
    const ix = orders.findIndex((o) => o.id === row.id);
    if (ix >= 0) orders[ix] = { ...orders[ix], ...row };
    else orders.push(row);
  }
  writeJson("orders.json", orders);

  let payments = readJson("payments.json", []);
  if (!Array.isArray(payments)) payments = [];
  const payRows = [
    {
      id: PAY_DERI_1,
      orderId: O_DERI_1,
      method: "bank_transfer",
      status: "paid",
      amount: 59400,
      transactionRef: "CBE-DERIBEW-59400",
      createdAt: daysAgo(17),
    },
    {
      id: PAY_DERI_2,
      orderId: O_DERI_2,
      method: "cod",
      status: "pending",
      amount: 268000,
      createdAt: daysAgo(3),
    },
  ];
  for (const row of payRows) {
    const ix = payments.findIndex((p) => p.id === row.id);
    if (ix >= 0) payments[ix] = { ...payments[ix], ...row };
    else payments.push(row);
  }
  writeJson("payments.json", payments);

  let companyReviews = readJson("company-reviews.json", []);
  if (!Array.isArray(companyReviews)) companyReviews = [];
  const crRows = [
    {
      id: CR_DERI_1,
      companyId: CO_BUILD,
      merchantId,
      orderId: O_DERI_1,
      rating: 5,
      comment:
        "Cement batches matched our site tests; Bole yard called before dispatch. Professional team.",
      createdAt: daysAgo(16),
    },
    {
      id: CR_DERI_2,
      companyId: CO_AGRO,
      merchantId,
      orderId: O_DERI_2,
      rating: 5,
      comment:
        "Urea quote was clear; loading window worked for our Adama pickup. Recommended for cooperatives.",
      createdAt: daysAgo(2),
    },
  ];
  for (const row of crRows) {
    const ix = companyReviews.findIndex((r) => r.id === row.id);
    if (ix >= 0) companyReviews[ix] = { ...companyReviews[ix], ...row };
    else companyReviews.push(row);
  }
  writeJson("company-reviews.json", companyReviews);

  let productReviews = readJson("product-reviews.json", []);
  if (!Array.isArray(productReviews)) productReviews = [];
  const prRows = [
    {
      id: PR_DERI_1,
      productId: P_CE,
      merchantId,
      orderId: O_DERI_1,
      rating: 5,
      comment:
        "50kg bags consistent weight on spot checks; stickers traceable to plant batch.",
      createdAt: daysAgo(16),
    },
    {
      id: PR_DERI_2,
      productId: P_UREA,
      merchantId,
      orderId: O_DERI_2,
      rating: 5,
      comment: "Prilled urea flowing well; documentation for cooperative audit.",
      createdAt: daysAgo(2),
    },
  ];
  for (const row of prRows) {
    const ix = productReviews.findIndex((r) => r.id === row.id);
    if (ix >= 0) productReviews[ix] = { ...productReviews[ix], ...row };
    else productReviews.push(row);
  }
  writeJson("product-reviews.json", productReviews);

  let notifications = readJson("notifications.json", []);
  if (!Array.isArray(notifications)) notifications = [];
  const nRow = {
    id: N_DERI_SUP,
    userId: supplierUserId,
    kind: "order_new",
    title: "New order",
    body: `${merchantName.split("—")[0]?.trim() ?? "Buyer"} placed an order — urea delivery to Adama (Deribew demo).`,
    href: `/supplier/orders/${O_DERI_2}`,
    read: false,
    createdAt: daysAgo(4),
  };
  const ni = notifications.findIndex((n) => n.id === N_DERI_SUP);
  if (ni >= 0) notifications[ni] = { ...notifications[ni], ...nRow };
  else notifications.push(nRow);
  writeJson("notifications.json", notifications);

  let chats = readJson("chat-messages.json", []);
  if (!Array.isArray(chats)) chats = [];
  const chatRow = {
    id: CHAT_DERI,
    orderId: O_DERI_2,
    senderId: merchantId,
    senderName: merchantName,
    content:
      "Please confirm truck access at the cooperative gate Friday morning — we can offload from 08:00.",
    createdAt: daysAgo(3),
    kind: "text",
  };
  const ci = chats.findIndex((c) => c.id === CHAT_DERI);
  if (ci >= 0) chats[ci] = { ...chats[ci], ...chatRow };
  else chats.push(chatRow);
  writeJson("chat-messages.json", chats);

  let companies = readJson("companies.json", []);
  if (!Array.isArray(companies)) companies = [];
  for (let i = 0; i < companies.length; i++) {
    if (companies[i].id === CO_BUILD) {
      companies[i] = {
        ...companies[i],
        totalReviews: Math.max(companies[i].totalReviews ?? 0, 19),
        ratingAverage: 4.75,
      };
    }
    if (companies[i].id === CO_AGRO) {
      companies[i] = {
        ...companies[i],
        totalReviews: Math.max(companies[i].totalReviews ?? 0, 13),
        ratingAverage: 4.65,
      };
    }
  }
  writeJson("companies.json", companies);

  let products = readJson("products.json", []);
  if (!Array.isArray(products)) products = [];
  for (let i = 0; i < products.length; i++) {
    if (products[i].id === P_CE) {
      products[i] = {
        ...products[i],
        totalOrdersCount: Math.max(products[i].totalOrdersCount ?? 0, 43),
      };
    }
    if (products[i].id === P_UREA) {
      products[i] = {
        ...products[i],
        totalOrdersCount: Math.max(products[i].totalOrdersCount ?? 0, 157),
      };
    }
  }
  writeJson("products.json", products);

  console.log(
    "Commerce: orders",
    O_DERI_1,
    O_DERI_2,
    "payments, reviews, chat, notification merged.",
  );
}

main();
