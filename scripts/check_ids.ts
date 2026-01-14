
import mongoose from 'mongoose';
import { FuelProduct, SaleEntry } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function checkIds() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri!);

        console.log("--- Fuel Products ---");
        const products = await FuelProduct.find({});
        products.forEach(p => console.log(`Name: ${p.productName}, ID: ${p._id}`));

        console.log("\n--- Sale Entries (First 2) ---");
        const sales = await SaleEntry.find({}).limit(2);
        sales.forEach(s => console.log(`Entry ID: ${s._id}, Product ID Stored: ${s.fuelProductId}, Date: ${s.saleDate}`));

        await mongoose.disconnect();
    } catch (e) { console.error(e); }
}

checkIds();
