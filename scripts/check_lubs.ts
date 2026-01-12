
import mongoose from 'mongoose';
import { LubricantProduct } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function checkLubs() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not set in .local.env");
        }

        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);

        const lubs = await LubricantProduct.find({});
        console.log(`Found ${lubs.length} lubricants.`);

        if (lubs.length === 0) {
            console.log("⚠️ No lubricants found! Seeding a test lubricant...");
            const newLub = new LubricantProduct({
                _id: new mongoose.Types.ObjectId().toString(),
                productName: "20W40 Oil",
                mrpRate: 350,
                saleRate: 300,
                minimumStock: 10,
                currentStock: 100,
                isActive: true
            });
            await newLub.save();
            console.log("✅ Seeded Test Lubricant");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkLubs();
