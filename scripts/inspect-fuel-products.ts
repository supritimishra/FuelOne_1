import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
    if (!MONGO_URI) {
        console.error("MONGODB_URI is not defined");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;
        const products = await db.collection('fuelproducts').find({}).toArray();

        console.log("--- Current Fuel Products (Raw) ---");
        products.forEach(p => {
            console.log(JSON.stringify(p));
        });
        console.log("----------------------------");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
