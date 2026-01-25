import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema.js';

let pool: Pool | null = null;
let db: any = null;

export function getDb() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not defined');
    }

    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 5, // Limit connections in serverless environment
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        // Initialize Drizzle
        db = drizzle(pool, { schema });
    }

    return { db, pool };
}
