
import { Pool } from 'pg';

const connectionString = "postgresql://postgres.rozgwrsgenmsixvrdvxu:%40Tkhg9966@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

async function run() {
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        const res = await pool.query('SELECT customer_name, sale_date, total_amount FROM guest_sales ORDER BY sale_date DESC LIMIT 20');
        console.log("\n--- DATABASE SOURCE INFO ---");
        console.log("Host: aws-1-ap-south-1.pooler.supabase.com");
        console.log("Database: postgres");
        console.log("Table: guest_sales");
        console.log("\n--- RECENT ENTRIES (Showing Top 20) ---");
        console.table(res.rows);
    } catch (e) {
        console.error("Error connecting to DB:", e);
    } finally {
        pool.end();
    }
}

run();
