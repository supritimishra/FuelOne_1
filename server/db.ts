import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";
import { config } from "dotenv";
import path from "path";

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not set. Postgres features (Auth/Tenants) will fail unless migrated to MongoDB.");
  // throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Define implementations based on environment
const usePostgres = !!process.env.DATABASE_URL;

let poolImpl: Pool;
let dbImpl: any;

if (usePostgres) {
  const dbUrl = process.env.DATABASE_URL!;
  poolImpl = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    statement_timeout: 60000,
    query_timeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    max: 20,
    min: 2,
    idleTimeoutMillis: 30 * 60 * 1000,
  });
  dbImpl = drizzle({ client: poolImpl, schema });
} else {
  console.log("ℹ️ Running in Mongo-only mode (Mocking Postgres Pool)");
  poolImpl = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => ({
      query: async () => ({ rows: [], rowCount: 0 }),
      release: () => { },
    }),
    on: () => { },
    end: async () => { },
  } as any as Pool;

  dbImpl = new Proxy({}, {
    get: () => { throw new Error("Postgres DB accessed in Mongo-only mode"); }
  });
}

export const pool = poolImpl;
export const db = dbImpl;
