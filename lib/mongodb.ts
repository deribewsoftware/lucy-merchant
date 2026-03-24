import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    'Add MONGODB_URI to .env.local (see .env.example). Example: mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0',
  );
}

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

/**
 * Shared MongoClient for server-side code (API routes, server actions, server-only data loaders).
 * Do not import from client components — the driver uses Node.js APIs.
 */
const clientPromise: Promise<MongoClient> =
  process.env.NODE_ENV === "development"
    ? (globalForMongo._mongoClientPromise ??= createClientPromise(uri))
    : createClientPromise(uri);

export default clientPromise;

/** Default database name when you want an explicit name (URI may omit /dbname). */
export async function getMongoDb(name?: string) {
  const client = await clientPromise;
  const dbName = name ?? process.env.MONGODB_DB ?? "lucy_merchant";
  return client.db(dbName);
}
