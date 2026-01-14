
import mongoose from 'mongoose';
import { FuelProduct, Nozzle, SaleEntry } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function fixDataIds() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("Missing URI");

        await mongoose.connect(uri);

        console.log("Fetching Fuel Products...");
        const products = await FuelProduct.find({});
        const productMap = new Map();

        products.forEach(p => {
            console.log(` - ${p.productName}: ${p._id}`);
            if (p.productName.includes("Motor")) productMap.set("MS", p._id);
            if (p.productName.includes("Diesel")) productMap.set("HSD", p._id);
            if (p.productName.includes("Premium")) productMap.set("XP", p._id);
        });

        // 1. Fix Nozzles
        console.log("\nFixing Nozzles...");
        const nozzles = await Nozzle.find({});
        for (const n of nozzles) {
            let newId = null;
            if (n.fuelProductId === "MS-1") newId = productMap.get("MS");
            else if (n.fuelProductId === "HSD-1") newId = productMap.get("HSD");
            else if (n.fuelProductId === "XP-1") newId = productMap.get("XP");

            if (newId) {
                console.log(`Updating Nozzle ${n.nozzleNumber} (${n._id}): ${n.fuelProductId} -> ${newId}`);
                n.fuelProductId = newId;
                await n.save();
            }
        }

        // 2. Fix Sale Entries
        console.log("\nFixing Sale Entries...");
        const sales = await SaleEntry.find({});
        for (const s of sales) {
            let newId = null;
            if (s.fuelProductId === "MS-1") newId = productMap.get("MS");
            else if (s.fuelProductId === "HSD-1") newId = productMap.get("HSD");
            else if (s.fuelProductId === "XP-1") newId = productMap.get("XP");

            if (newId) {
                console.log(`Updating SaleEntry (${s._id}): ${s.fuelProductId} -> ${newId}`);
                s.fuelProductId = newId;
                await s.save();
            }
        }

        await mongoose.disconnect();
        console.log("Done.");

    } catch (e) {
        console.error(e);
    }
}

fixDataIds();
