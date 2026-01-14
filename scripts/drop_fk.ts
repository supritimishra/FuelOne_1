
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Attempting to drop employee_id FK from sale_entries...");
    try {
        await db.execute(sql`ALTER TABLE sale_entries DROP CONSTRAINT IF EXISTS sale_entries_employee_id_employees_id_fk`);
        await db.execute(sql`ALTER TABLE sale_entries DROP CONSTRAINT IF EXISTS sale_entries_employee_id_fkey`); // Try generic name too
        console.log("Constraint dropped (if it existed).");
    } catch (e) {
        console.error("Error dropping constraint:", e);
    }
    process.exit(0);
}

main();
