
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking and fixing schema for lub_sales table...");

    try {
        // Check if columns exist, if not add them
        await db.execute(sql`
      ALTER TABLE lub_sales 
      ADD COLUMN IF NOT EXISTS gst numeric(5, 2),
      ADD COLUMN IF NOT EXISTS customer_name text,
      ADD COLUMN IF NOT EXISTS tin_gst_no text,
      ADD COLUMN IF NOT EXISTS bill_no text;
    `);

        console.log("Successfully added missing columns to lub_sales (if they were missing).");
    } catch (error) {
        console.error("Error fixing schema:", error);
    }

    process.exit(0);
}

main();
