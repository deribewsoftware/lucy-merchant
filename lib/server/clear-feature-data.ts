import type { Document } from "mongodb";
import type { DataClearFeatureId } from "@/lib/domain/data-clear-features";
import type { UserRecord } from "@/lib/domain/types";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

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

async function mongoDeleteMany(collections: string[]) {
  if (!isMongoConfigured()) return;
  const db = await getMongoDb();
  for (const name of collections) {
    await db.collection(name).deleteMany({});
  }
}

/** Matches seed-mongodb object collections: `{ _id: "root", data }` */
async function mongoResetRootObject(collection: string, data: object) {
  if (!isMongoConfigured()) return;
  const db = await getMongoDb();
  await db.collection(collection).deleteMany({});
  await db.collection(collection).insertOne({ _id: "root", data } as Document);
}

/** Same collections as `scripts/seed-mongodb.mjs` */
const MONGO_ARRAY_ALL = [
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
] as const;

const MONGO_OBJECT_ALL = ["carts", "presence", "system"] as const;

async function clearAllApplicationData(): Promise<void> {
  const users = readJsonFile<UserRecord[]>("users.json", []);
  const keptStaff = users.filter(
    (u) => u.role === "admin" || u.role === "system_admin",
  );

  writeJsonFile("users.json", keptStaff);
  writeJsonFile("categories.json", []);
  writeJsonFile("companies.json", []);
  writeJsonFile("products.json", []);
  writeJsonFile("orders.json", []);
  writeJsonFile("payments.json", []);
  writeJsonFile("carts.json", {});
  writeJsonFile("company-reviews.json", []);
  writeJsonFile("product-reviews.json", []);
  writeJsonFile("product-comments.json", []);
  writeJsonFile("chat-messages.json", []);
  writeJsonFile("notifications.json", []);
  writeJsonFile("presence.json", {});
  writeJsonFile("admin-audit.json", []);
  writeJsonFile("system.json", DEFAULT_SYSTEM);

  if (!isMongoConfigured()) return;
  const db = await getMongoDb();
  for (const name of MONGO_ARRAY_ALL) {
    await db.collection(name).deleteMany({});
  }
  for (const name of MONGO_OBJECT_ALL) {
    await db.collection(name).deleteMany({});
  }
  await db.collection("carts").insertOne({ _id: "root", data: {} } as Document);
  await db.collection("presence").insertOne({ _id: "root", data: {} } as Document);
  await db
    .collection("system")
    .insertOne({ _id: "root", data: DEFAULT_SYSTEM } as Document);
  if (keptStaff.length > 0) {
    const docs = keptStaff.map((u) => ({ _id: u.id, ...u }) as Document);
    await db.collection("users").insertMany(docs, { ordered: false });
  }
}

export async function clearFeatureData(feature: DataClearFeatureId): Promise<void> {
  switch (feature) {
    case "all": {
      await clearAllApplicationData();
      return;
    }
    case "catalog": {
      writeJsonFile("categories.json", []);
      writeJsonFile("companies.json", []);
      writeJsonFile("products.json", []);
      await mongoDeleteMany(["categories", "companies", "products"]);
      return;
    }
    case "commerce": {
      writeJsonFile("orders.json", []);
      writeJsonFile("payments.json", []);
      writeJsonFile("carts.json", {});
      await mongoDeleteMany(["orders", "payments"]);
      await mongoResetRootObject("carts", {});
      return;
    }
    case "reviews": {
      writeJsonFile("company-reviews.json", []);
      writeJsonFile("product-reviews.json", []);
      writeJsonFile("product-comments.json", []);
      await mongoDeleteMany([
        "company_reviews",
        "product_reviews",
        "product_comments",
      ]);
      return;
    }
    case "chat": {
      writeJsonFile("chat-messages.json", []);
      await mongoDeleteMany(["chat_messages"]);
      return;
    }
    case "notifications": {
      writeJsonFile("notifications.json", []);
      await mongoDeleteMany(["notifications"]);
      return;
    }
    case "presence": {
      writeJsonFile("presence.json", {});
      await mongoResetRootObject("presence", {});
      return;
    }
    case "audit": {
      writeJsonFile("admin-audit.json", []);
      return;
    }
    case "users": {
      const users = readJsonFile<UserRecord[]>("users.json", []);
      const kept = users.filter(
        (u) => u.role === "admin" || u.role === "system_admin",
      );
      writeJsonFile("users.json", kept);
      if (!isMongoConfigured()) return;
      const db = await getMongoDb();
      await db.collection("users").deleteMany({
        role: { $nin: ["admin", "system_admin"] },
      });
      return;
    }
    case "system": {
      writeJsonFile("system.json", DEFAULT_SYSTEM);
      await mongoResetRootObject("system", DEFAULT_SYSTEM);
      return;
    }
  }
}
