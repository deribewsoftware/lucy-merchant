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

/**
 * Atlas connection strings often use a literal `<password>` placeholder.
 * When `MONGODB_PASSWORD` is set, substitute it with URL encoding (required for @ : / ? # etc.).
 */
export function resolveMongoConnectionUri(): string {
  let uri = process.env.MONGODB_URI?.trim() ?? "";
  const pwd = process.env.MONGODB_PASSWORD;
  if (uri && /<password>/i.test(uri) && pwd !== undefined && pwd !== "") {
    uri = uri.replace(/<password>/gi, encodeURIComponent(pwd));
  }
  return uri;
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
  const uri = resolveMongoConnectionUri();
  if (!uri) {
    return Promise.reject(missingUriError());
  }
  if (/<password>/i.test(uri)) {
    return Promise.reject(
      new Error(
        "MONGODB_URI still contains <password>. Set MONGODB_PASSWORD in .env.local or paste the real password (URL-encoded if it contains special characters).",
      ),
    );
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
