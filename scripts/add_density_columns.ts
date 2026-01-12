import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL must be set");
    process.exit(1);
}

const client = new Client({ connectionString });

async function main() {
    await client.connect();
    try {
        console.log("Adding columns to tank_daily_readings...");

        // List of columns to add
        const columns = [
            "invoice_no TEXT",
            "before_dip NUMERIC(12,3)",
            "before_stock NUMERIC(12,3)",
            "after_dip NUMERIC(12,3)",
            "after_stock NUMERIC(12,3)",
            "stock_dumped NUMERIC(12,3)",
            "stock_difference NUMERIC(12,3)",
            "density NUMERIC(12,3)",
            "temp NUMERIC(12,3)",
            "hydrometer NUMERIC(12,3)"
        ];

        for (const col of columns) {
            try {
                await client.query(`ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS ${col}`);
                console.log(`Column added (if not exists): ${col}`);
            } catch (e: any) {
                console.error(`Failed to add column ${col}:`, e.message);
            }
        }

        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

main();
