/**
 * Full local "database" wipe: JSON stores, deploy-seed, uploads, optional MongoDB.
 *
 * - JSON: `data/` + `lib/data/deploy-seed/` (same files the app uses via lib/store/json-file)
 * - Uploads: `public/uploads/*` and `%TEMP%/lucy-merchant/uploads` (matches getUploadTarget)
 * - MongoDB: cleared when MONGODB_URI is usable; set DATA_CLEAN_SKIP_MONGODB=1 to skip
 *
 * Usage: npm run data:clean
 */
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { MongoClient, ServerApiVersion } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

/** Matches `defaultSystem()` in lib/db/catalog.ts */
const DEFAULT_SYSTEM = {
  postProductPoints: 5,
  orderCommissionPercent: 3,
  supplierOrderCommissionPercent: 2,
  featuredProductCost: 50,
  freePostingEnabled: false,
  freeCommissionEnabled: false,
  freeSupplierCommissionEnabled: false,
  commissionPaymentGraceHours: 72,
};

const ARRAY_FILES = [
  "users.json",
  "categories.json",
  "companies.json",
  "products.json",
  "orders.json",
  "payments.json",
  "company-reviews.json",
  "product-reviews.json",
  "product-comments.json",
  "chat-messages.json",
  "notifications.json",
  "admin-audit.json",
];

const OBJECT_FILES = {
  "carts.json": {},
  "presence.json": {},
  "system.json": DEFAULT_SYSTEM,
};

const ALL_KNOWN_JSON = new Set([
  ...ARRAY_FILES,
  ...Object.keys(OBJECT_FILES),
]);

const MONGO_ARRAY_COLLECTIONS = [
  "users",
  "categories",
  "companies",
  "products",
  "orders",
  "payments",
  "company_reviews",
  "product_reviews",
  "product_comments",
  "chat_messages",
  "notifications",
];

const MONGO_OBJECT_COLLECTIONS = ["carts", "presence", "system"];

function resolveMongoUri() {
  let uri = process.env.MONGODB_URI?.trim() || "";
  const pwd = process.env.MONGODB_PASSWORD;
  if (uri && /<password>/i.test(uri) && pwd !== undefined && pwd !== "") {
    uri = uri.replace(/<password>/gi, encodeURIComponent(pwd));
  }
  return uri;
}

function writeCleanJsonDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ARRAY_FILES) {
    fs.writeFileSync(path.join(dir, f), "[]\n", "utf8");
  }
  for (const [f, body] of Object.entries(OBJECT_FILES)) {
    fs.writeFileSync(path.join(dir, f), `${JSON.stringify(body, null, 2)}\n`, "utf8");
  }
  /** Remove any other *.json left from older seeds or experiments */
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".json") || ALL_KNOWN_JSON.has(name)) continue;
    try {
      fs.unlinkSync(path.join(dir, name));
      console.log(`Removed stray JSON: ${path.relative(ROOT, path.join(dir, name))}`);
    } catch {
      /* ignore */
    }
  }
}

function cleanLocalUploads() {
  const publicRoot = path.join(ROOT, "public", "uploads");
  if (fs.existsSync(publicRoot)) {
    for (const ent of fs.readdirSync(publicRoot, { withFileTypes: true })) {
      const p = path.join(publicRoot, ent.name);
      try {
        fs.rmSync(p, { recursive: true, force: true });
        console.log(`Removed uploads: ${path.relative(ROOT, p)}`);
      } catch {
        /* ignore */
      }
    }
  }

  const tmpRoot = path.join(tmpdir(), "lucy-merchant", "uploads");
  if (fs.existsSync(tmpRoot)) {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
      console.log(`Removed temp uploads: ${tmpRoot}`);
    } catch {
      /* ignore */
    }
  }
}

async function clearMongoIfConfigured() {
  if (process.env.DATA_CLEAN_SKIP_MONGODB === "1") {
    console.log("MongoDB: skipped (DATA_CLEAN_SKIP_MONGODB=1)");
    return;
  }

  const uri = resolveMongoUri();
  if (!uri || /<password>/i.test(uri)) {
    console.log("MongoDB: skipped (MONGODB_URI not set or still has <password>)");
    return;
  }

  const dbName = process.env.MONGODB_DB?.trim() || "lucy_merchant";
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    serverSelectionTimeoutMS: 8_000,
    connectTimeoutMS: 8_000,
  });

  await client.connect();
  try {
    const db = client.db(dbName);
    for (const name of MONGO_ARRAY_COLLECTIONS) {
      const r = await db.collection(name).deleteMany({});
      console.log(`MongoDB ${name}: deleted ${r.deletedCount}`);
    }
    for (const name of MONGO_OBJECT_COLLECTIONS) {
      const r = await db.collection(name).deleteMany({});
      console.log(`MongoDB ${name}: deleted ${r.deletedCount}`);
    }
    console.log(`MongoDB: database "${dbName}" collections cleared.`);
  } finally {
    await client.close();
  }
}

async function main() {
  const dataDir = path.join(ROOT, "data");
  const seedDir = path.join(ROOT, "lib", "data", "deploy-seed");

  writeCleanJsonDir(dataDir);
  writeCleanJsonDir(seedDir);
  cleanLocalUploads();

  console.log(`Cleared JSON: ${path.relative(ROOT, dataDir)}`);
  console.log(`Cleared JSON: ${path.relative(ROOT, seedDir)}`);
  console.log(
    "Note: Empty categories.json → two starter categories on first getCategories() (lib/db/catalog.ts).",
  );
  console.log(
    "Note: users.json is empty — register or use ADMIN_BOOTSTRAP_KEY + /api/auth/bootstrap-admin.",
  );

  try {
    await clearMongoIfConfigured();
  } catch (e) {
    console.warn("MongoDB clear failed (other data was still wiped):", e?.message ?? e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
