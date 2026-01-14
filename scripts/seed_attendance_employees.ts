
import { db } from "../server/db";
import { employees } from "../shared/schema";
import { eq } from "drizzle-orm";

const TARGET_EMPLOYEES = [
    { name: "Barun", role: "Pump Boy" },
    { name: "Dibakor", role: "Pump Boy" },
    { name: "Harashit", role: "Pump Boy" },
    { name: "Krishna", role: "Sweeper" },
    { name: "Milon", role: "Pump Boy" },
    { name: "Raju", role: "Pump Boy" },
    { name: "Rakhy", role: "Manager" },
    { name: "Sanjay", role: "Shift Supervisor" },
    { name: "Suchitra Mondal", role: "Sweeper" },
    { name: "Sukanto", role: "Pump Boy" },
];

async function seed() {
    console.log("Seeding employees...");

    try {
        // 1. Deactivate all existing employees
        await db.update(employees).set({ isActive: false, status: 'Inactive' });
        console.log("Deactivated all existing employees.");

        // 2. Upsert specific target employees
        for (const t of TARGET_EMPLOYEES) {
            // Search by name (case-insensitive distinct? assuming exact match for now)
            const existing = await db.select().from(employees).where(eq(employees.employeeName, t.name));

            if (existing.length > 0) {
                // Activate and Update Role
                await db.update(employees)
                    .set({ isActive: true, status: 'Active', designation: t.role })
                    .where(eq(employees.id, existing[0].id));
                console.log(`Updated active status for: ${t.name}`);
            } else {
                // Insert New
                await db.insert(employees).values({
                    employeeName: t.name,
                    designation: t.role,
                    isActive: true,
                    status: 'Active',
                    // Default placeholders for required fields if any (schema allows nulls mostly)
                    mobileNumber: "0000000000"
                });
                console.log(`Created new employee: ${t.name}`);
            }
        }
        console.log("Employee seeding completed successfully.");
    } catch (e) {
        console.error("Seeding failed:", e);
    }
    process.exit(0);
}

seed();
