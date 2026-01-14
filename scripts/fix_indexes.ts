
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function fixDailySaleRatesIndexes() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("Missing URI");

        console.log("Connecting...");
        await mongoose.connect(uri);

        const collection = mongoose.connection.collection('dailysalerates');

        // List indexes
        const indexes = await collection.indexes();
        console.log("Current Indexes:", indexes);

        // Drop all indexes except _id
        console.log("Dropping indexes...");
        await collection.dropIndexes();
        console.log("Indexes dropped.");

        // Optionally verify
        const remaining = await collection.indexes();
        console.log("Remaining Indexes:", remaining);

        await mongoose.disconnect();

    } catch (e) {
        console.error("Error:", e);
    }
}

fixDailySaleRatesIndexes();
