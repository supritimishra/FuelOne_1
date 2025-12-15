import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";
import { config } from "dotenv";
import path from "path";

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Enhanced timeout settings for Neon database
  connectionTimeoutMillis: 30000, // 30 seconds
  statement_timeout: 60000, // 60 seconds
  query_timeout: 60000, // 60 seconds
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  max: 20, // Maximum pool size
  min: 2,  // Minimum pool size
  idleTimeoutMillis: 30 * 60 * 1000, // 30 minutes
});
export const db = drizzle({ client: pool, schema });
