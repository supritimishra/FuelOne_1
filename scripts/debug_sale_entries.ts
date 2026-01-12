
import mongoose from 'mongoose';
import { SaleEntry } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function debugSaleEntries() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("Missing URI");

        await mongoose.connect(uri);

        console.log("Checking Sale Entries...");
        const entries = await SaleEntry.find({}).sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${entries.length} recent entries.`);
        entries.forEach(e => {
            console.log(JSON.stringify(e.toObject(), null, 2));
        });

        await mongoose.disconnect();

    } catch (e) {
        console.error(e);
    }
}

debugSaleEntries();
