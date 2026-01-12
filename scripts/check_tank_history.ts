
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
        console.log("Checking tank_daily_readings (Last 5 entries)...");
        const res = await client.query(`
      SELECT 
        tank_id, 
        reading_date, 
        opening_stock, 
        meter_sale, 
        stock_received,
        closing_stock, 
        dip_reading, 
        variation,
        density,
        temp,
        before_dip,
        after_dip,
        invoice_no
      FROM tank_daily_readings 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

        if (res.rows.length === 0) {
            console.log("No records found in tank_daily_readings.");
        } else {
            console.table(res.rows);
        }
    } catch (e) {
        console.error("Error querying table:", e);
    } finally {
        await client.end();
    }
}

main();
