
import mongoose from 'mongoose';
import { FuelProduct } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function cleanupDuplicates() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("Missing URI");

        await mongoose.connect(uri);

        const products = await FuelProduct.find({});
        console.log(`Total Fuel Products: ${products.length}`);

        const seenNames = new Map();
        for (const p of products) {
            if (seenNames.has(p.productName)) {
                console.log(`Duplicate found: ${p.productName} (${p._id}) - Removing...`);
                await FuelProduct.deleteOne({ _id: p._id });
            } else {
                seenNames.set(p.productName, p._id);
            }
        }

        console.log("Cleanup Done.");
        await mongoose.disconnect();

    } catch (e) {
        console.error(e);
    }
}

cleanupDuplicates();
