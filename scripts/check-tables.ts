
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), '.local.env') });
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

(async () => {
    try {
        const client = await pool.connect();
        const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
        console.log("Tables:", res.rows.map(r => r.table_name));
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();
