
import mongoose from 'mongoose';
import { Nozzle, Tank } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function checkNozzles() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not set in .local.env");
        }

        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);

        const nozzles = await Nozzle.find({});
        console.log(`Found ${nozzles.length} nozzles.`);

        if (nozzles.length === 0) {
            console.log("⚠️ No nozzles found! Seeding test data...");

            // Create Tank first
            const tank = new Tank({
                _id: new mongoose.Types.ObjectId().toString(),
                tankNumber: "T-1",
                fuelProductId: "MS-1", // Placeholder
                capacity: 20000,
                currentStock: 5000,
                isActive: true
            });
            await tank.save();

            // Create Nozzle
            const nozzle = new Nozzle({
                _id: new mongoose.Types.ObjectId().toString(),
                nozzleNumber: "N-1",
                pumpStation: "P1",
                tankId: tank._id,
                fuelProductId: "MS-1",
                isActive: true
            });
            await nozzle.save();
            console.log("✅ Seeded Tank and Nozzle");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkNozzles();
