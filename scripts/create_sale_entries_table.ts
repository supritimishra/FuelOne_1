
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Creating sale_entries table...");
    try {
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sale_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
        shift_id UUID REFERENCES duty_shifts(id),
        pump_station TEXT,
        nozzle_id UUID REFERENCES nozzles(id),
        fuel_product_id UUID REFERENCES fuel_products(id),
        opening_reading NUMERIC(12, 3),
        closing_reading NUMERIC(12, 3),
        quantity NUMERIC(12, 3),
        price_per_unit NUMERIC(10, 2),
        net_sale_amount NUMERIC(12, 2),
        employee_id UUID REFERENCES employees(id),
        created_at TIMESTAMP DEFAULT NOW(),
        created_by UUID REFERENCES users(id)
      );
    `);
        console.log("Table created successfully.");
    } catch (err: any) {
        console.error("Error creating table:", err);
    }
    process.exit(0);
}

main();
