import { MongoClient, ServerApiVersion, type Collection, type Db } from "mongodb";
import { DEFAULT_PHOTO, type ReportDoc } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | null | undefined;
}

function requireMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your environment to start the server.",
    );
  }
  return uri;
}

const mongoUri = requireMongoUri();
const dbName = process.env.MONGODB_DB || "fixr";
const collectionName = process.env.REPORTS_COLLECTION || "reports";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null =
  global._mongoClientPromise ?? null;
let indexesEnsured = false;

async function createClient() {
  return new MongoClient(mongoUri, {
    serverApi: ServerApiVersion.v1,
  });
}

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client;
  if (!clientPromise) {
    clientPromise = createClient().then((c) => {
      client = c;
      return client;
    });
    global._mongoClientPromise = clientPromise;
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const cli = await getMongoClient();
  return cli.db(dbName);
}

export async function getReportsCollection(): Promise<Collection<ReportDoc>> {
  const db = await getDb();
  const collection = db.collection<ReportDoc>(collectionName);
  await ensureIndexes(collection);
  return collection;
}

async function ensureIndexes(collection: Collection<ReportDoc>) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  await collection.createIndex({ location: "2dsphere" });
  await collection.createIndex({ createdAt: -1 });
}

export function withPhotoDefaults(doc: Omit<ReportDoc, "photo">): ReportDoc {
  return { ...doc, photo: DEFAULT_PHOTO };
}

