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

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Add it to .env.local or the environment (see .env.example).",
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

  await client.connect();
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
  console.error(e);
  process.exit(1);
});
