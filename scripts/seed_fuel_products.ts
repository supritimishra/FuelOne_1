
import { db } from "../server/db";
import { fuelProducts } from "../shared/schema";
import { FuelProduct } from "../server/models";
import { eq } from "drizzle-orm";
import mongoose from "mongoose";
import crypto from "crypto";
import { config } from "dotenv";
import path from "path";

// Load env
config({ path: path.resolve(process.cwd(), '.local.env') });

async function main() {
    console.log("Starting seed of fuel products...");

    // Connect Mongoose
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI missing");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to Mongo");

    const products = [
        { name: "High Speed Diesel", short: "HSD", lfrn: "LFRN001" },
        { name: "Motor Spirit", short: "MS", lfrn: "LFRN002" },
        { name: "Xtra Premium", short: "XP", lfrn: "LFRN003" },
    ];

    // Attempt to drop collection to reset validation rules if any
    try {
        console.log("Dropping fuelproducts collection to reset schema...");
        await mongoose.connection.db.collection('fuelproducts').drop();
        console.log("Dropped.");
    } catch (e: any) {
        console.log("Drop failed (maybe didn't exist):", e.message);
    }

    for (const p of products) {
        console.log(`Processing ${p.short}...`);

        // Check PG
        const pgExists = await db.select().from(fuelProducts).where(eq(fuelProducts.shortName, p.short));

        // Check Mongo
        const mongoExists = await FuelProduct.findOne({ shortName: p.short });

        let finalId = crypto.randomUUID();

        if (mongoExists && pgExists.length > 0) {
            console.log(`  - Exists in both.`);
            const mId = mongoExists._id.toString();
            const pId = pgExists[0].id;
            if (mId !== pId) {
                console.warn(`  - IDs MISMATCH! Mongo: ${mId}, PG: ${pId}`);
                console.warn("  - Fixing PG to match Mongo...");
                // Delete PG and re-insert with Mongo ID
                await db.delete(fuelProducts).where(eq(fuelProducts.id, pId));
                await db.insert(fuelProducts).values({
                    id: mId,
                    productName: p.name,
                    shortName: p.short,
                    lfrn: p.lfrn,
                    isActive: true
                });
                console.log("  - Fixed.");
            }
            continue;
        }

        if (mongoExists) {
            finalId = mongoExists._id.toString();
            console.log(`  - Found in Mongo (${finalId}), creating in PG...`);
            await db.insert(fuelProducts).values({
                id: finalId,
                productName: p.name,
                shortName: p.short,
                lfrn: p.lfrn,
                isActive: true
            }).onConflictDoNothing();
        } else if (pgExists.length > 0) {
            finalId = pgExists[0].id;
            console.log(`  - Found in PG (${finalId}), creating in Mongo...`);
            await FuelProduct.create({
                _id: finalId,
                productName: p.name,
                shortName: p.short,
                lfrn: p.lfrn,
                isActive: true,
                gstPercentage: 0,
                wgtPercentage: 0,
                tdsPercentage: 0
            });
        } else {
            console.log(`  - Missing in both. Creating new (${finalId})...`);
            // Create in Mongo
            const newM = new FuelProduct({
                _id: finalId,
                productName: p.name,
                shortName: p.short,
                lfrn: p.lfrn,
                isActive: true,
                gstPercentage: 0,
                wgtPercentage: 0,
                tdsPercentage: 0
            });
            await newM.save();

            // Create in PG
            await db.insert(fuelProducts).values({
                id: finalId,
                productName: p.name,
                shortName: p.short,
                lfrn: p.lfrn,
                isActive: true
            });
        }
    }

    console.log("Done");
    process.exit(0);
}

main().catch(console.error);
