
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { TankerSale } from '../server/models.js';

// Load env
config({ path: path.resolve(process.cwd(), '.local.env') });

async function testMongo() {
    let uri = process.env.MONGODB_URI;

    // Allow passing via command line
    if (process.argv[2] && process.argv[2].startsWith('mongodb')) {
        uri = process.argv[2];
        console.log("👉 Using URI from command line argument.");
    }

    if (!uri || uri.trim() === "") {
        console.error("❌ MONGODB_URI is missing or empty.");
        console.error(`Status in .local.env: ${process.env.MONGODB_URI === "" ? 'Empty String ""' : 'Undefined'}`);
        console.error("\nPossible fixes:");
        console.error("1. Save the .local.env file (Ctrl+S)");
        console.error("2. Run manually: npx tsx scripts/test_mongo.ts \"mongodb+srv://...\"");
        process.exit(1);
    }

    try {
        console.log("🔌 Connecting to MongoDB...");
        // Mask password in logs
        const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
        console.log(`Target: ${maskedUri}`);

        await mongoose.connect(uri);
        console.log("✅ Connected!");

        console.log("📝 Inserting test Tanker Sale...");
        const testSale = new TankerSale({
            fuelProductId: "test-product-id",
            tankerSaleQuantity: 5000,
            notes: "Test entry from script",
            createdBy: "script"
        });

        const saved = await testSale.save();
        console.log("✅ Data inserted successfully:");
        console.log(saved);

        console.log("🗑️ Cleaning up test data...");
        await TankerSale.findByIdAndDelete(saved._id);
        console.log("✅ Cleanup complete.");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testMongo();
