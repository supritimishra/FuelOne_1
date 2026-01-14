
import { db } from "../server/db";
import { employees } from "../shared/schema";

async function main() {
    const all = await db.select().from(employees);
    console.log("Current Employees:", all);
    process.exit(0);
}

main().catch(console.error);
