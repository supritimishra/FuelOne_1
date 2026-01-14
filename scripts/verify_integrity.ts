
import mongoose from 'mongoose';
import { TankerSale, FuelProduct } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function verifyIntegrity() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("Missing URI");

        await mongoose.connect(uri);

        const sales = await TankerSale.find({});
        console.log(`Tanker Sales: ${sales.length}`);

        const products = await FuelProduct.find({});
        const productIds = new Set(products.map(p => p._id.toString()));
        console.log(`Active Product IDs:`, Array.from(productIds));

        let orphaned = 0;
        sales.forEach(s => {
            if (!productIds.has(s.fuelProductId)) {
                console.log(`Orphaned Sale: ${s._id} (Product: ${s.fuelProductId})`);
                orphaned++;
            }
        });

        if (orphaned === 0) {
            console.log("✅ All sales linked correctly.");
        } else {
            console.log(`⚠️ ${orphaned} sales have invalid product references!`);
        }

        await mongoose.disconnect();

    } catch (e) {
        console.error(e);
    }
}

verifyIntegrity();
