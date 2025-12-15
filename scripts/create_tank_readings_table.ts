
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
        console.log("Creating tank_daily_readings table...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS tank_daily_readings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        reading_date date NOT NULL DEFAULT CURRENT_DATE,
        tank_id uuid REFERENCES tanks(id),
        opening_stock numeric(12, 3),
        stock_received numeric(12, 3) DEFAULT 0,
        meter_sale numeric(12, 3) DEFAULT 0,
        closing_stock numeric(12, 3),
        dip_reading numeric(12, 3),
        variation numeric(12, 3),
        notes text,
        created_at timestamp DEFAULT now(),
        created_by uuid REFERENCES users(id)
      );
    `);
        console.log("Table 'tank_daily_readings' created successfully!");
    } catch (e) {
        console.error("Error creating table:", e);
    } finally {
        await client.end();
    }
}

main();
