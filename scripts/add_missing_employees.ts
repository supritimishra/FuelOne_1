
import { db } from "../server/db";
import { employees } from "../shared/schema";
import { eq } from "drizzle-orm";

const requiredEmployees = [
    "Barun",
    "Dibakor",
    "Harashit",
    "Krishna",
    "Milon",
    "Raju",
    "Rakhy",
    "Sanjay",
    "Suchitra Mondal",
    "Sukanto"
];

async function main() {
    console.log("Checking and adding missing employees...");

    const existingEmployees = await db.select().from(employees);
    const existingNames = new Set(existingEmployees.map(e => e.employeeName?.toLowerCase()));

    for (const name of requiredEmployees) {
        if (!existingNames.has(name.toLowerCase())) {
            console.log(`Adding missing employee: ${name}`);
            await db.insert(employees).values({
                employeeName: name,
                designation: "Staff", // Default designation
                status: "Active",
                isActive: true,
                mobileNumber: "0000000000", // Placeholder
            });
        } else {
            console.log(`Employee already exists: ${name}`);
        }
    }

    console.log("Done.");
    process.exit(0);
}

main().catch(console.error);
