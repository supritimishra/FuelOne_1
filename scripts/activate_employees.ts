
import { db } from "../server/db";
import { employees } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Activating all employees...");
    await db.update(employees).set({ isActive: true });
    console.log("All employees set to active.");
    process.exit(0);
}

main().catch(console.error);
