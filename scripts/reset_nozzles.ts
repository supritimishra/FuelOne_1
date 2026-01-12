
import { db } from "../server/db";
import { nozzles, tanks, fuelProducts, saleEntries } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Resetting nozzles to P-N-1 and P-N-2...");

    try {
        // 1. Get Fuel Products (Need at least MS and HSD or XP)
        const products = await db.select().from(fuelProducts);
        if (products.length === 0) {
            console.error("No fuel products found. Please seed products first.");
            process.exit(1);
        }
        const ms = products.find(p => p.shortName === "MS") || products[0];
        const hsd = products.find(p => p.shortName === "HSD") || products[0];

        // 2. Clear existing sale_entries and nozzles
        console.log("Deleting existing sale entries and nozzles...");
        await db.delete(saleEntries);
        await db.delete(nozzles);

        // 3. Clear/Get Tanks (Need at least 1)
        let tank1 = await db.query.tanks.findFirst({
            where: eq(tanks.tankNumber, "1")
        });

        if (!tank1) {
            console.log("Creating Tank-1...");
            const [t] = await db.insert(tanks).values({
                tankNumber: "1",
                fuelProductId: ms.id,
                capacity: "20000",
                currentStock: "5000"
            }).returning();
            tank1 = t;
        }

        // 4. Create 2 Nozzles
        // User asked for "P-N-1" and "P-N-2".
        // UI logic: `P{pump_station}-{product_short}{nozzle_number}`
        // Let's set pumpStation="1", nozzleNumber="1" -> P1-MS1
        // Let's set pumpStation="1", nozzleNumber="2" -> P1-MS2

        // To get closer to "P-N-1", maybe pumpStation="N", nozzleNumber="1"? -> PN-MS1.
        // I'll stick to standard naming: Pump 1, Nozzle 1 & 2.

        console.log("Creating Nozzle 1...");
        await db.insert(nozzles).values({
            nozzleNumber: "1",
            pumpStation: "1",
            tankId: tank1.id,
            fuelProductId: ms.id, // Linked to MS
            isActive: true
        });

        console.log("Creating Nozzle 2...");
        await db.insert(nozzles).values({
            nozzleNumber: "2",
            pumpStation: "1",
            tankId: tank1.id, // Both on same tank for simplicity? Or separate? Let's use same.
            fuelProductId: ms.id, // Also MS? Or 2nd product? User didn't specify. I'll make one MS, one HSD if I can satisfy tank product rule.
            // Tank 1 is MS. So Nozzle linked to Tank 1 MUST be MS.
            isActive: true
        });

        // If we want different products, we need another tank.
        // Let's just make both MS for now to match Tank 1. 

        console.log("Done.");
    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

main();
