import { MongoClient, ServerApiVersion } from "mongodb";

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function createClientPromise(connectionUri: string): Promise<MongoClient> {
  const client = new MongoClient(connectionUri, options);
  return client.connect();
}

function missingUriError(): Error {
  return new Error(
    "MONGODB_URI is not set. Add it to .env.local (see .env.example). Example: mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0",
  );
}

/** True when `MONGODB_URI` is present (trimmed non-empty). */
export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

let clientPromise: Promise<MongoClient> | null = null;

/**
 * Lazily connects on first call — avoids Atlas handshakes during `next build` and when Mongo is unused.
 */
export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    return Promise.reject(missingUriError());
  }
  if (!clientPromise) {
    clientPromise =
      process.env.NODE_ENV === "development"
        ? (globalForMongo._mongoClientPromise ??= createClientPromise(uri))
        : createClientPromise(uri);
  }
  return clientPromise;
}

/** Default database name when you want an explicit name (URI may omit /dbname). */
export async function getMongoDb(name?: string) {
  const client = await getMongoClientPromise();
  const dbName = name ?? process.env.MONGODB_DB ?? "lucy_merchant";
  return client.db(dbName);
}
