/**
 * Writes realistic Lucy Merchant B2B demo data into ./data
 *
 * Demo logins (password for all: LucyDemo2025!):
 *   admin@demo.lucymerchant.local     — admin
 *   hailu@demo.lucymerchant.local     — supplier (3 verified companies)
 *   kidist@demo.lucymerchant.local    — supplier (1 pending + 1 verified)
 *   aster@demo.lucymerchant.local     — merchant
 *   solomon@demo.lucymerchant.local   — merchant
 *
 * Merges users: removes prior @demo.lucymerchant.local accounts, keeps everyone else.
 *
 * Run: npm run seed:demo
 */
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const DEMO_DOMAIN = "@demo.lucymerchant.local";

const I = {
  admin: "10000000-0000-4000-a000-000000000001",
  supHailu: "10000000-0000-4000-a000-000000000002",
  supKidist: "10000000-0000-4000-a000-000000000003",
  merAster: "10000000-0000-4000-a000-000000000004",
  merSolomon: "10000000-0000-4000-a000-000000000005",

  catBuild: "20000000-0000-4000-a000-000000000001",
  catCement: "20000000-0000-4000-a000-000000000002",
  catSteel: "20000000-0000-4000-a000-000000000003",
  catTimber: "20000000-0000-4000-a000-000000000004",
  catIndustrial: "20000000-0000-4000-a000-000000000005",
  catElectrical: "20000000-0000-4000-a000-000000000006",
  catFastener: "20000000-0000-4000-a000-000000000007",
  catAgri: "20000000-0000-4000-a000-000000000008",
  catFertilizer: "20000000-0000-4000-a000-000000000009",
  catPackaging: "20000000-0000-4000-a000-00000000000a",

  coSteel: "30000000-0000-4000-a000-000000000001",
  coCement: "30000000-0000-4000-a000-000000000002",
  coAgro: "30000000-0000-4000-a000-000000000003",
  coElec: "30000000-0000-4000-a000-000000000004",
  coTimber: "30000000-0000-4000-a000-000000000005",

  p01: "40000000-0000-4000-a000-000000000001",
  p02: "40000000-0000-4000-a000-000000000002",
  p03: "40000000-0000-4000-a000-000000000003",
  p04: "40000000-0000-4000-a000-000000000004",
  p05: "40000000-0000-4000-a000-000000000005",
  p06: "40000000-0000-4000-a000-000000000006",
  p07: "40000000-0000-4000-a000-000000000007",
  p08: "40000000-0000-4000-a000-000000000008",
  p09: "40000000-0000-4000-a000-000000000009",
  p10: "40000000-0000-4000-a000-00000000000a",
  p11: "40000000-0000-4000-a000-00000000000b",
  p12: "40000000-0000-4000-a000-00000000000c",
  p13: "40000000-0000-4000-a000-00000000000d",
  p14: "40000000-0000-4000-a000-00000000000e",
  p15: "40000000-0000-4000-a000-00000000000f",
  p16: "40000000-0000-4000-a000-000000000010",
  p17: "40000000-0000-4000-a000-000000000011",
  p18: "40000000-0000-4000-a000-000000000012",
  p19: "40000000-0000-4000-a000-000000000013",
  p20: "40000000-0000-4000-a000-000000000014",
  p21: "40000000-0000-4000-a000-000000000015",
  p22: "40000000-0000-4000-a000-000000000016",
  p23: "40000000-0000-4000-a000-000000000017",
  p24: "40000000-0000-4000-a000-000000000018",

  o1: "50000000-0000-4000-a000-000000000001",
  o2: "50000000-0000-4000-a000-000000000002",
  o3: "50000000-0000-4000-a000-000000000003",
  o4: "50000000-0000-4000-a000-000000000004",

  pay1: "60000000-0000-4000-a000-000000000001",
  pay2: "60000000-0000-4000-a000-000000000002",

  cr1: "70000000-0000-4000-a000-000000000001",
  cr2: "70000000-0000-4000-a000-000000000002",

  pr1: "80000000-0000-4000-a000-000000000001",
  pr2: "80000000-0000-4000-a000-000000000002",
  pr3: "80000000-0000-4000-a000-000000000003",

  cm1: "90000000-0000-4000-a000-000000000001",
  cm2: "90000000-0000-4000-a000-000000000002",
  cm3: "90000000-0000-4000-a000-000000000003",

  n1: "a0000000-0000-4000-a000-000000000001",
};

const IMG = {
  cement:
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
  steel:
    "https://images.unsplash.com/photo-1565194292457-47a49aeeb2f8?w=800&q=80",
  rebar:
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
  timber:
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
  electrical:
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80",
  agri: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
  warehouse:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
  bolts:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
};

const LOGO = {
  steel:
    "https://images.unsplash.com/photo-1565194292457-47a49aeeb2f8?w=200&h=200&fit=crop&q=80",
  cement:
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&h=200&fit=crop&q=80",
  agro: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=200&h=200&fit=crop&q=80",
  elec: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=200&h=200&fit=crop&q=80",
  timber:
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop&q=80",
};

function write(name, obj) {
  const p = path.join(DATA, name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
  console.log("wrote", name);
}

function main() {
  if (!fs.existsSync(DATA)) {
    fs.mkdirSync(DATA, { recursive: true });
  }

  const pwd = "LucyDemo2025!";
  const hash = bcrypt.hashSync(pwd, 10);
  const daysAgo = (n) =>
    new Date(Date.now() - n * 86400000).toISOString();

  const seedUsers = [
    {
      id: I.admin,
      email: `admin${DEMO_DOMAIN}`,
      passwordHash: hash,
      role: "admin",
      name: "Selamawit Mulugeta",
      createdAt: daysAgo(120),
    },
    {
      id: I.supHailu,
      email: `hailu${DEMO_DOMAIN}`,
      passwordHash: hash,
      role: "supplier",
      name: "Hailu Bekele",
      points: 850,
      createdAt: daysAgo(90),
    },
    {
      id: I.supKidist,
      email: `kidist${DEMO_DOMAIN}`,
      passwordHash: hash,
      role: "supplier",
      name: "Kidist Tadesse",
      points: 420,
      createdAt: daysAgo(45),
    },
    {
      id: I.merAster,
      email: `aster${DEMO_DOMAIN}`,
      passwordHash: hash,
      role: "merchant",
      name: "Aster Construction PLC",
      createdAt: daysAgo(60),
    },
    {
      id: I.merSolomon,
      email: `solomon${DEMO_DOMAIN}`,
      passwordHash: hash,
      role: "merchant",
      name: "Solomon Trading House",
      createdAt: daysAgo(30),
    },
  ];

  const usersPath = path.join(DATA, "users.json");
  let mergedUsers = [...seedUsers];
  if (fs.existsSync(usersPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
      if (Array.isArray(raw)) {
        const kept = raw.filter(
          (u) =>
            typeof u.email === "string" &&
            !u.email.toLowerCase().endsWith(DEMO_DOMAIN.toLowerCase()),
        );
        mergedUsers = [...seedUsers, ...kept];
      }
    } catch {
      /* use seed only */
    }
  }
  write("users.json", mergedUsers);

  const categories = [
    { id: I.catBuild, name: "Building & construction", parentId: null },
    { id: I.catCement, name: "Cement & binders", parentId: I.catBuild },
    { id: I.catSteel, name: "Steel & metals", parentId: I.catBuild },
    { id: I.catTimber, name: "Timber & panels", parentId: I.catBuild },
    { id: I.catIndustrial, name: "Industrial & MRO", parentId: null },
    { id: I.catElectrical, name: "Electrical & cabling", parentId: I.catIndustrial },
    { id: I.catFastener, name: "Fasteners & welding", parentId: I.catIndustrial },
    { id: I.catAgri, name: "Agriculture & inputs", parentId: null },
    { id: I.catFertilizer, name: "Fertilizers & crop nutrition", parentId: I.catAgri },
    { id: I.catPackaging, name: "Packaging & sacks", parentId: I.catAgri },
  ];
  write("categories.json", categories);

  const companies = [
    {
      id: I.coSteel,
      ownerId: I.supHailu,
      name: "Addis Ababa Steel & Rebar Trading PLC",
      description:
        "Wholesale rebar, mesh, and structural steel for contractors across Addis and Oromia. Mill certificates available. Same-week delivery on stock SKUs.",
      logo: LOGO.steel,
      licenseDocument: "https://www.example.com/licenses/steel-demo.pdf",
      isVerified: true,
      ratingAverage: 4.8,
      totalReviews: 24,
      createdAt: daysAgo(400),
    },
    {
      id: I.coCement,
      ownerId: I.supHailu,
      name: "Blue Nile Cement Distributors",
      description:
        "Bulk and bagged Portland and PPC cement from major producers. Dedicated fleet for 20–40t drops to site or yard.",
      logo: LOGO.cement,
      licenseDocument: "Trade license #C-2019-88421 (demo)",
      isVerified: true,
      ratingAverage: 4.6,
      totalReviews: 31,
      createdAt: daysAgo(350),
    },
    {
      id: I.coTimber,
      ownerId: I.supHailu,
      name: "East Africa Timber & Plywood Ltd",
      description:
        "Rough-sawn hardwood, treated poles, and structural plywood. Moisture-tested batches; export-grade packing on request.",
      logo: LOGO.timber,
      isVerified: true,
      ratingAverage: 4.4,
      totalReviews: 11,
      createdAt: daysAgo(280),
    },
    {
      id: I.coAgro,
      ownerId: I.supKidist,
      name: "Hawassa Agro Inputs Cooperative",
      description:
        "Regional hub for urea, NPK blends, and crop protection. Agronomist support for cooperative buyers.",
      logo: LOGO.agro,
      isVerified: true,
      ratingAverage: 4.7,
      totalReviews: 18,
      createdAt: daysAgo(200),
    },
    {
      id: I.coElec,
      ownerId: I.supKidist,
      name: "Bole Electrical Wholesale",
      description:
        "LV cables, breakers, conduit, and industrial lighting. Authorized distributor channel (demo data).",
      logo: LOGO.elec,
      isVerified: false,
      ratingAverage: 0,
      totalReviews: 0,
      createdAt: daysAgo(14),
    },
  ];
  write("companies.json", companies);

  const baseProduct = (id, companyId, categoryId, rest) => ({
    id,
    companyId,
    categoryId,
    totalOrdersCount: rest.totalOrdersCount ?? 0,
    averageRating: rest.averageRating ?? 0,
    createdAt: rest.createdAt ?? daysAgo(20),
    viewCount: rest.viewCount ?? 0,
    ...rest,
  });

  const products = [
    baseProduct(I.p01, I.coCement, I.catCement, {
      name: "Portland Cement 50kg (CEM I)",
      description:
        "52.5R equivalent strength class for structural pours. Palletized 40 bags; shrink-wrapped.",
      tags: ["cement", "50kg", "structural", "bulk"],
      price: 485,
      availableQuantity: 2400,
      minOrderQuantity: 40,
      maxDeliveryQuantity: 800,
      deliveryTime: "3–5 business days",
      totalOrdersCount: 156,
      averageRating: 4.7,
      imageUrl: IMG.cement,
      isFeatured: true,
      shipFromRegion: "Addis Ababa",
      viewCount: 1280,
      createdAt: daysAgo(300),
    }),
    baseProduct(I.p02, I.coCement, I.catCement, {
      name: "PPC Bulk Cement (per metric ton)",
      description:
        "Pozzolanic Portland cement in pneumatic tanker or 1t bags. MOQ 10t.",
      tags: ["ppc", "bulk", "cement"],
      price: 11800,
      availableQuantity: 500,
      minOrderQuantity: 10,
      maxDeliveryQuantity: 120,
      deliveryTime: "5–8 business days",
      totalOrdersCount: 42,
      averageRating: 4.5,
      imageUrl: IMG.warehouse,
      shipFromRegion: "Debre Birhan",
      viewCount: 410,
    }),
    baseProduct(I.p03, I.coSteel, I.catSteel, {
      name: "Deformed Rebar 12mm × 12m",
      description:
        "B500B equivalent, bundled. Mill test reports per heat number.",
      tags: ["rebar", "12mm", "construction"],
      price: 108,
      availableQuantity: 8500,
      minOrderQuantity: 200,
      maxDeliveryQuantity: 4000,
      deliveryTime: "2–4 business days",
      totalOrdersCount: 289,
      averageRating: 4.8,
      imageUrl: IMG.rebar,
      isFeatured: true,
      shipFromRegion: "Addis Ababa",
      viewCount: 2100,
      createdAt: daysAgo(400),
    }),
    baseProduct(I.p04, I.coSteel, I.catSteel, {
      name: "Deformed Rebar 8mm × 12m",
      description: "For slabs and light structural mesh support.",
      tags: ["rebar", "8mm"],
      price: 52,
      availableQuantity: 12000,
      minOrderQuantity: 500,
      maxDeliveryQuantity: 6000,
      deliveryTime: "2–4 business days",
      totalOrdersCount: 190,
      averageRating: 4.6,
      imageUrl: IMG.rebar,
      shipFromRegion: "Addis Ababa",
      viewCount: 890,
    }),
    baseProduct(I.p05, I.coSteel, I.catSteel, {
      name: "Galvanized Corrugated Sheet 0.4mm",
      description:
        "Standard 28-gauge profile, 2m effective width. Roofing and cladding.",
      tags: ["sheet", "gi", "roofing"],
      price: 385,
      availableQuantity: 2200,
      minOrderQuantity: 50,
      maxDeliveryQuantity: 800,
      deliveryTime: "4–6 business days",
      totalOrdersCount: 74,
      averageRating: 4.3,
      imageUrl: IMG.steel,
      shipFromRegion: "Addis Ababa",
      viewCount: 340,
    }),
    baseProduct(I.p06, I.coTimber, I.catTimber, {
      name: "Structural Plywood 18mm × 1.22×2.44m",
      description: "WBP bonded, calibrated thickness. Suitable for formwork.",
      tags: ["plywood", "formwork", "18mm"],
      price: 2850,
      availableQuantity: 600,
      minOrderQuantity: 25,
      maxDeliveryQuantity: 200,
      deliveryTime: "5–7 business days",
      totalOrdersCount: 52,
      averageRating: 4.5,
      imageUrl: IMG.timber,
      shipFromRegion: "Jimma",
      viewCount: 220,
    }),
    baseProduct(I.p07, I.coTimber, I.catTimber, {
      name: "Eucalyptus Poles 8–10cm × 3m",
      description: "Pressure-treated where noted; farm fencing and shade nets.",
      tags: ["poles", "eucalyptus", "agri"],
      price: 185,
      availableQuantity: 4000,
      minOrderQuantity: 100,
      maxDeliveryQuantity: 1500,
      deliveryTime: "4–6 business days",
      totalOrdersCount: 33,
      averageRating: 4.2,
      imageUrl: IMG.timber,
      shipFromRegion: "Hawassa",
      viewCount: 150,
    }),
    baseProduct(I.p08, I.coElec, I.catElectrical, {
      name: "Copper Power Cable 4×95mm² (1m)",
      description:
        "XLPE insulated, armoured. Cut length service; drum pricing on request.",
      tags: ["cable", "copper", "lv"],
      price: 4200,
      availableQuantity: 800,
      minOrderQuantity: 50,
      maxDeliveryQuantity: 300,
      deliveryTime: "7–10 business days",
      totalOrdersCount: 0,
      averageRating: 0,
      imageUrl: IMG.electrical,
      shipFromRegion: "Addis Ababa",
      viewCount: 95,
    }),
    baseProduct(I.p09, I.coElec, I.catElectrical, {
      name: "MCCB 250A 3P (demo SKU)",
      description: "Thermal-magnetic, panel-mount. Brand may vary by batch.",
      tags: ["breaker", "mccb", "panel"],
      price: 12800,
      availableQuantity: 45,
      minOrderQuantity: 2,
      maxDeliveryQuantity: 20,
      deliveryTime: "5–7 business days",
      totalOrdersCount: 0,
      averageRating: 0,
      imageUrl: IMG.electrical,
      shipFromRegion: "Addis Ababa",
      viewCount: 62,
    }),
    baseProduct(I.p10, I.coElec, I.catElectrical, {
      name: "LED High-Bay 200W IP65",
      description: "Warehouse and factory lighting; 5000K; U-bracket mount.",
      tags: ["led", "highbay", "industrial"],
      price: 6200,
      availableQuantity: 200,
      minOrderQuantity: 4,
      maxDeliveryQuantity: 80,
      deliveryTime: "4–6 business days",
      totalOrdersCount: 12,
      averageRating: 4.4,
      imageUrl: IMG.electrical,
      isFeatured: true,
      shipFromRegion: "Addis Ababa",
      viewCount: 280,
    }),
    baseProduct(I.p11, I.coSteel, I.catFastener, {
      name: "Hex Bolts M16×80 (8.8) — box of 100",
      description: "Zinc plated, partial thread. With nuts and washers kit.",
      tags: ["bolts", "fasteners", "m16"],
      price: 1850,
      availableQuantity: 350,
      minOrderQuantity: 5,
      maxDeliveryQuantity: 120,
      deliveryTime: "3–5 business days",
      totalOrdersCount: 61,
      averageRating: 4.5,
      imageUrl: IMG.bolts,
      shipFromRegion: "Addis Ababa",
      viewCount: 175,
    }),
    baseProduct(I.p12, I.coSteel, I.catFastener, {
      name: "Welding Electrodes E6013 (5kg pack)",
      description: "General purpose rutile; low spatter for site repairs.",
      tags: ["welding", "electrodes", "e6013"],
      price: 980,
      availableQuantity: 800,
      minOrderQuantity: 10,
      maxDeliveryQuantity: 400,
      deliveryTime: "3–5 business days",
      totalOrdersCount: 88,
      averageRating: 4.6,
      imageUrl: IMG.steel,
      shipFromRegion: "Addis Ababa",
      viewCount: 240,
    }),
    baseProduct(I.p13, I.coAgro, I.catFertilizer, {
      name: "Urea 46%N — 50kg bag",
      description: "Prilled urea; warehouse batch tracking. Cooperative pricing tier.",
      tags: ["urea", "fertilizer", "50kg"],
      price: 2650,
      availableQuantity: 5000,
      minOrderQuantity: 100,
      maxDeliveryQuantity: 2000,
      deliveryTime: "4–7 business days",
      totalOrdersCount: 210,
      averageRating: 4.7,
      imageUrl: IMG.agri,
      shipFromRegion: "Hawassa",
      viewCount: 560,
      createdAt: daysAgo(250),
    }),
    baseProduct(I.p14, I.coAgro, I.catFertilizer, {
      name: "NPK 15-15-15 — 50kg",
      description: "Balanced compound for maize and teff rotations.",
      tags: ["npk", "fertilizer", "compound"],
      price: 3200,
      availableQuantity: 3200,
      minOrderQuantity: 80,
      maxDeliveryQuantity: 1500,
      deliveryTime: "4–7 business days",
      totalOrdersCount: 145,
      averageRating: 4.5,
      imageUrl: IMG.agri,
      shipFromRegion: "Hawassa",
      viewCount: 330,
    }),
    baseProduct(I.p15, I.coAgro, I.catPackaging, {
      name: "PP Woven Sack 50kg (laminated)",
      description: "UV-stabilized; suitable for grain and fertilizer.",
      tags: ["sack", "packaging", "50kg"],
      price: 42,
      availableQuantity: 50000,
      minOrderQuantity: 500,
      maxDeliveryQuantity: 20000,
      deliveryTime: "5–8 business days",
      totalOrdersCount: 92,
      averageRating: 4.4,
      imageUrl: IMG.warehouse,
      shipFromRegion: "Hawassa",
      viewCount: 190,
    }),
    baseProduct(I.p16, I.coElec, I.catElectrical, {
      name: "PVC Conduit 25mm × 3m (heavy)",
      description: "Orange HD conduit; 20 pieces per bundle.",
      tags: ["conduit", "pvc", "electrical"],
      price: 185,
      availableQuantity: 6000,
      minOrderQuantity: 100,
      maxDeliveryQuantity: 3000,
      deliveryTime: "4–6 business days",
      totalOrdersCount: 28,
      averageRating: 4.1,
      imageUrl: IMG.electrical,
      shipFromRegion: "Addis Ababa",
      viewCount: 120,
    }),
    baseProduct(I.p17, I.coCement, I.catCement, {
      name: "Masonry Cement 40kg",
      description: "Mortar and plaster mixes; softer set for blockwork.",
      tags: ["masonry", "cement", "40kg"],
      price: 395,
      availableQuantity: 1800,
      minOrderQuantity: 50,
      maxDeliveryQuantity: 600,
      deliveryTime: "3–5 business days",
      totalOrdersCount: 67,
      averageRating: 4.4,
      imageUrl: IMG.cement,
      shipFromRegion: "Addis Ababa",
      viewCount: 205,
    }),
    baseProduct(I.p18, I.coSteel, I.catSteel, {
      name: "Welded Wire Mesh 6×150×150 (2.4×6m sheet)",
      description: "For slabs and precast; B500B wire.",
      tags: ["mesh", "welded", "slab"],
      price: 2850,
      availableQuantity: 400,
      minOrderQuantity: 10,
      maxDeliveryQuantity: 120,
      deliveryTime: "4–6 business days",
      totalOrdersCount: 41,
      averageRating: 4.5,
      imageUrl: IMG.rebar,
      shipFromRegion: "Addis Ababa",
      viewCount: 160,
    }),
    baseProduct(I.p19, I.coTimber, I.catTimber, {
      name: "MDF Board 18mm × 1.83×2.75m",
      description: "Furniture-grade; low formaldehyde class (demo label).",
      tags: ["mdf", "board", "furniture"],
      price: 1950,
      availableQuantity: 220,
      minOrderQuantity: 15,
      maxDeliveryQuantity: 80,
      deliveryTime: "6–9 business days",
      totalOrdersCount: 19,
      averageRating: 4.0,
      imageUrl: IMG.timber,
      shipFromRegion: "Dire Dawa",
      viewCount: 88,
    }),
    baseProduct(I.p20, I.coAgro, I.catFertilizer, {
      name: "DAP 18-46-0 — 50kg",
      description: "Diammonium phosphate; basal application.",
      tags: ["dap", "phosphate", "fertilizer"],
      price: 3450,
      availableQuantity: 2800,
      minOrderQuantity: 60,
      maxDeliveryQuantity: 1200,
      deliveryTime: "5–8 business days",
      totalOrdersCount: 76,
      averageRating: 4.6,
      imageUrl: IMG.agri,
      shipFromRegion: "Hawassa",
      viewCount: 275,
    }),
    baseProduct(I.p21, I.coCement, I.catCement, {
      name: "Hydrated Lime 25kg",
      description: "Soil stabilization and masonry additive.",
      tags: ["lime", "hydrated", "25kg"],
      price: 285,
      availableQuantity: 900,
      minOrderQuantity: 40,
      maxDeliveryQuantity: 400,
      deliveryTime: "4–6 business days",
      totalOrdersCount: 22,
      averageRating: 4.2,
      imageUrl: IMG.cement,
      shipFromRegion: "Mojo",
      viewCount: 70,
    }),
    baseProduct(I.p22, I.coSteel, I.catSteel, {
      name: "Angle Iron 50×50×5mm × 6m",
      description: "Hot-rolled equal angle; primer coated.",
      tags: ["angle", "steel", "structural"],
      price: 2850,
      availableQuantity: 320,
      minOrderQuantity: 12,
      maxDeliveryQuantity: 100,
      deliveryTime: "3–5 business days",
      totalOrdersCount: 38,
      averageRating: 4.4,
      imageUrl: IMG.steel,
      shipFromRegion: "Addis Ababa",
      viewCount: 142,
    }),
    baseProduct(I.p23, I.coAgro, I.catPackaging, {
      name: "Jute Bag 90×60cm (new)",
      description: "Coffee and pulse export sacks; food-grade thread.",
      tags: ["jute", "sack", "export"],
      price: 28,
      availableQuantity: 8000,
      minOrderQuantity: 200,
      maxDeliveryQuantity: 4000,
      deliveryTime: "6–10 business days",
      totalOrdersCount: 14,
      averageRating: 4.3,
      imageUrl: IMG.warehouse,
      shipFromRegion: "Jimma",
      viewCount: 98,
    }),
    baseProduct(I.p24, I.coElec, I.catElectrical, {
      name: "Earthing Rod 1.2m copper-bonded",
      description: "Threaded; includes inspection pit recommendation sheet.",
      tags: ["earthing", "grounding", "electrical"],
      price: 1850,
      availableQuantity: 150,
      minOrderQuantity: 6,
      maxDeliveryQuantity: 60,
      deliveryTime: "5–7 business days",
      totalOrdersCount: 8,
      averageRating: 4.0,
      imageUrl: IMG.electrical,
      shipFromRegion: "Addis Ababa",
      viewCount: 55,
    }),
  ];
  write("products.json", products);

  const orders = [
    {
      id: I.o1,
      merchantId: I.merAster,
      items: [
        {
          productId: I.p01,
          companyId: I.coCement,
          quantity: 80,
          price: 485,
          subtotal: 38800,
        },
        {
          productId: I.p03,
          companyId: I.coSteel,
          quantity: 400,
          price: 108,
          subtotal: 43200,
        },
      ],
      totalPrice: 82000,
      deliveryLocation: "Bole, Addis Ababa — Site gate A",
      status: "completed",
      commissionAmount: 2460,
      paymentStatus: "paid",
      paymentMethod: "bank_transfer",
      createdAt: daysAgo(45),
    },
    {
      id: I.o2,
      merchantId: I.merSolomon,
      items: [
        {
          productId: I.p13,
          companyId: I.coAgro,
          quantity: 200,
          price: 2650,
          subtotal: 530000,
        },
      ],
      totalPrice: 530000,
      deliveryLocation: "Hawassa Industrial Park, Zone C",
      status: "in_progress",
      commissionAmount: 15900,
      paymentStatus: "pending",
      paymentMethod: "cod",
      createdAt: daysAgo(5),
    },
    {
      id: I.o3,
      merchantId: I.merAster,
      items: [
        {
          productId: I.p10,
          companyId: I.coElec,
          quantity: 12,
          price: 6200,
          subtotal: 74400,
        },
      ],
      totalPrice: 74400,
      deliveryLocation: "Kality Warehouse 7",
      status: "pending",
      commissionAmount: 2232,
      paymentStatus: "pending",
      paymentMethod: "cod",
      createdAt: daysAgo(1),
    },
    {
      id: I.o4,
      merchantId: I.merAster,
      items: [
        {
          productId: I.p06,
          companyId: I.coTimber,
          quantity: 40,
          price: 2850,
          subtotal: 114000,
        },
      ],
      totalPrice: 114000,
      deliveryLocation: "Adama — Project Meskel",
      status: "delivered",
      commissionAmount: 3420,
      paymentStatus: "paid",
      paymentMethod: "cod",
      createdAt: daysAgo(12),
    },
  ];
  write("orders.json", orders);

  const payments = [
    {
      id: I.pay1,
      orderId: I.o1,
      method: "bank_transfer",
      status: "paid",
      amount: 82000,
      transactionRef: "DEMO-BOA-88421",
      createdAt: daysAgo(44),
    },
    {
      id: I.pay2,
      orderId: I.o4,
      method: "cod",
      status: "paid",
      amount: 114000,
      createdAt: daysAgo(10),
    },
  ];
  write("payments.json", payments);

  write("company-reviews.json", [
    {
      id: I.cr1,
      companyId: I.coCement,
      merchantId: I.merAster,
      orderId: I.o1,
      rating: 5,
      comment:
        "Cement arrived on schedule; batch stickers matched our QC checklist.",
      createdAt: daysAgo(40),
    },
    {
      id: I.cr2,
      companyId: I.coSteel,
      merchantId: I.merAster,
      orderId: I.o1,
      rating: 5,
      comment:
        "Rebar bundles straight and tagged; driver helped with offload coordination.",
      createdAt: daysAgo(39),
    },
  ]);

  write("product-reviews.json", [
    {
      id: I.pr1,
      productId: I.p01,
      merchantId: I.merAster,
      orderId: I.o1,
      rating: 5,
      comment: "Consistent 50kg weight spot-checks; will reorder for Phase 2.",
      createdAt: daysAgo(40),
    },
    {
      id: I.pr2,
      productId: I.p03,
      merchantId: I.merAster,
      orderId: I.o1,
      rating: 5,
      comment: "12mm spec as quoted; MTR copies emailed same day.",
      createdAt: daysAgo(39),
    },
    {
      id: I.pr3,
      productId: I.p06,
      merchantId: I.merAster,
      orderId: I.o4,
      rating: 4,
      comment: "Good plywood; one sheet edge splinter — acceptable for our formwork.",
      createdAt: daysAgo(11),
    },
  ]);

  write("product-comments.json", [
    {
      id: I.cm1,
      productId: I.p01,
      userId: I.merSolomon,
      userName: "Solomon Trading House",
      comment:
        "Do you offer deferred payment for 120+ bag orders on NET30 terms?",
      parentId: null,
      createdAt: daysAgo(8),
      likedBy: [I.merAster],
    },
    {
      id: I.cm2,
      productId: I.p01,
      userId: I.supHailu,
      userName: "Hailu Bekele",
      comment:
        "Yes for verified buyers — open a ticket with your trade license and we send a credit application (demo).",
      parentId: I.cm1,
      createdAt: daysAgo(7),
      likedBy: [],
    },
    {
      id: I.cm3,
      productId: I.p13,
      userId: I.admin,
      userName: "Selamawit Mulugeta",
      comment:
        "Marketplace note: always confirm seasonal availability for bulk urea.",
      parentId: null,
      createdAt: daysAgo(3),
      likedBy: [I.supKidist],
    },
  ]);

  write("chat-messages.json", [
    {
      id: "b1000000-0000-4000-a000-000000000001",
      orderId: I.o2,
      senderId: I.merSolomon,
      senderName: "Solomon Trading House",
      content:
        "Please confirm loading date for the 200 bags — we can receive from Tuesday.",
      createdAt: daysAgo(4),
      kind: "text",
    },
    {
      id: "b1000000-0000-4000-a000-000000000002",
      orderId: I.o2,
      senderId: I.supKidist,
      senderName: "Kidist Tadesse",
      content: "Tuesday works. Truck plate AA-3-47821 (demo). ETA 09:00.",
      createdAt: daysAgo(4),
      kind: "text",
    },
    {
      id: "b1000000-0000-4000-a000-000000000003",
      orderId: I.o2,
      senderId: I.supKidist,
      senderName: "Kidist Tadesse",
      content: "",
      createdAt: daysAgo(3),
      kind: "price_proposal",
      proposedUnitPrice: 2580,
    },
  ]);

  write("notifications.json", [
    {
      id: I.n1,
      userId: I.supKidist,
      kind: "order_new",
      title: "New order",
      body: "Solomon Trading House placed a large urea order — review in supplier workspace.",
      href: `/supplier/orders/${I.o2}`,
      read: false,
      createdAt: daysAgo(5),
    },
  ]);

  write("carts.json", {});

  write("system.json", {
    postProductPoints: 5,
    orderCommissionPercent: 3,
    featuredProductCost: 50,
    freePostingEnabled: true,
    freeCommissionEnabled: false,
  });

  console.log("\nDone. Password for all demo accounts: LucyDemo2025!");
  console.log("Demo emails end with", DEMO_DOMAIN);
}

main();
