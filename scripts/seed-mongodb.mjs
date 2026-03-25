/**
 * Loads demo JSON (from ./data or lib/data/deploy-seed) into MongoDB.
 * Requires MONGODB_URI (and optionally MONGODB_DB, default lucy_merchant).
 * Reads .env.local when present (naive KEY=VALUE lines).
 *
 * Run after: npm run seed:demo
 * Usage: npm run seed:mongodb
 */
import fs from "fs";
import path from "path";
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

const ARRAY_FILES = [
  { file: "users.json", collection: "users" },
  { file: "categories.json", collection: "categories" },
  { file: "companies.json", collection: "companies" },
  { file: "products.json", collection: "products" },
  { file: "orders.json", collection: "orders" },
  { file: "payments.json", collection: "payments" },
  { file: "company-reviews.json", collection: "company_reviews" },
  { file: "product-reviews.json", collection: "product_reviews" },
  { file: "product-comments.json", collection: "product_comments" },
  { file: "chat-messages.json", collection: "chat_messages" },
  { file: "notifications.json", collection: "notifications" },
];

/** Single-document JSON objects (not arrays). */
const OBJECT_FILES = [
  { file: "carts.json", collection: "carts" },
  { file: "presence.json", collection: "presence" },
  { file: "system.json", collection: "system" },
];

function resolveDataDir() {
  const data = path.join(ROOT, "data");
  const seed = path.join(ROOT, "lib", "data", "deploy-seed");
  if (fs.existsSync(path.join(data, "users.json"))) return data;
  if (fs.existsSync(path.join(seed, "users.json"))) return seed;
  throw new Error(
    "No seed JSON found. Run: npm run seed:demo  (or ensure lib/data/deploy-seed has users.json)",
  );
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

/**
 * Atlas often ships URIs with literal `<password>`. If `MONGODB_PASSWORD` is set,
 * substitute it with proper URL encoding (required for @ : / ? # [ ] etc.).
 */
function resolveMongoUri() {
  let uri = process.env.MONGODB_URI?.trim() || "";
  const pwd = process.env.MONGODB_PASSWORD;
  if (!uri) return "";

  if (/<password>/i.test(uri) && pwd !== undefined && pwd !== "") {
    uri = uri.replace(/<password>/gi, encodeURIComponent(pwd));
  }

  // mongodb+srv://user:@host — empty password segment
  if (/mongodb(\+srv)?:\/\/[^:]+:@/i.test(uri)) {
    console.warn(
      "[seed:mongodb] MONGODB_URI has an empty password between : and @. Set the password in the URI or use MONGODB_PASSWORD with a <password> placeholder.",
    );
  }

  return uri;
}

function printAtlasAuthHelp() {
  console.error(`
MongoDB Atlas rejected the credentials (bad auth). Check:

  1. Atlas → Database Access: user exists and password matches what you put in .env.local.
     If unsure, edit the user → Edit Password → paste the new password into your URI.

  2. Connection string: copy from Atlas → Connect → Drivers → Node.js (full URI).

  3. Special characters in the password (@ : / ? # [ ] % etc.) must be percent-encoded
     in MONGODB_URI, OR keep the Atlas template and set:
       MONGODB_URI=mongodb+srv://myuser:<password>@cluster0.xxxxx.mongodb.net/...
       MONGODB_PASSWORD=your_actual_password
     (this script replaces <password> with an encoded value.)

  4. IP allowlist: Atlas → Network Access → allow your current IP (or 0.0.0.0/0 for dev).

  5. No angle brackets in the final URI except the literal <password> placeholder above.
`);
}

async function main() {
  const uri = resolveMongoUri();
  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Add it to .env.local or the environment (see .env.example).",
    );
    process.exit(1);
  }

  if (/<password>/i.test(uri)) {
    console.error(
      "MONGODB_URI still contains <password>. Set MONGODB_PASSWORD in .env.local or paste the real password (URL-encoded if it has special characters).",
    );
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB?.trim() || "lucy_merchant";
  const dataDir = resolveDataDir();
  console.log(`Using data from: ${path.relative(ROOT, dataDir)}`);
  console.log(`Database: ${dbName}`);

  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });

  try {
    await client.connect();
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? e.code : undefined;
    const msg = e instanceof Error ? e.message : String(e);
    if (code === 8000 || /authentication failed/i.test(msg)) {
      console.error("Connection failed:", msg);
      printAtlasAuthHelp();
    } else {
      console.error(e);
    }
    process.exit(1);
  }
  const db = client.db(dbName);

  try {
    for (const { file, collection } of ARRAY_FILES) {
      const full = path.join(dataDir, file);
      if (!fs.existsSync(full)) {
        console.warn(`  skip (missing): ${file}`);
        continue;
      }
      const arr = readJson(full);
      if (!Array.isArray(arr)) {
        console.warn(`  skip (not array): ${file}`);
        continue;
      }
      await db.collection(collection).deleteMany({});
      if (arr.length === 0) {
        console.log(`  ${collection}: 0 documents`);
        continue;
      }
      const docs = [];
      for (const item of arr) {
        if (item == null || typeof item.id !== "string") {
          throw new Error(`${file}: expected each item to have string id`);
        }
        docs.push({ _id: item.id, ...item });
      }
      await db.collection(collection).insertMany(docs, { ordered: false });
      console.log(`  ${collection}: ${docs.length} documents`);
    }

    for (const { file, collection } of OBJECT_FILES) {
      const full = path.join(dataDir, file);
      if (!fs.existsSync(full)) {
        console.warn(`  skip (missing): ${file}`);
        continue;
      }
      const obj = readJson(full);
      if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        console.warn(`  skip (not object): ${file}`);
        continue;
      }
      await db.collection(collection).deleteMany({});
      await db.collection(collection).insertOne({
        _id: "root",
        data: obj,
      });
      console.log(`  ${collection}: 1 document (root)`);
    }

    console.log("Done. App runtime still uses JSON/memory unless you add Mongo-backed reads.");
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  const code = e && typeof e === "object" && "code" in e ? e.code : undefined;
  const msg = e instanceof Error ? e.message : String(e);
  if (code === 8000 || /authentication failed/i.test(msg)) {
    console.error("MongoDB error:", msg);
    printAtlasAuthHelp();
  } else {
    console.error(e);
  }
  process.exit(1);
});
