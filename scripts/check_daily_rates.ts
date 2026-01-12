
import mongoose from 'mongoose';
import { DailySaleRate, FuelProduct } from '../server/models.js'; // Adjust path if needed
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function checkDailyRates() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("Missing URI");

        console.log("Connecting...");
        await mongoose.connect(uri);

        // 1. Check Fuel Products
        const products = await FuelProduct.find({});
        console.log(`Fuel Products found: ${products.length}`);
        products.forEach(p => console.log(` - ${p.productName} (${p._id})`));

        if (products.length === 0) {
            console.log("⚠️ No fuel products! Seeding...");
            // Seed for testing
            await FuelProduct.create([
                { _id: new mongoose.Types.ObjectId().toString(), productName: "High Speed Diesel", shortName: "HSD", lfrn: "HSD001", isActive: true },
                { _id: new mongoose.Types.ObjectId().toString(), productName: "Motor Spirit", shortName: "MS", lfrn: "MS001", isActive: true },
                { _id: new mongoose.Types.ObjectId().toString(), productName: "Xtra Premium", shortName: "XP", lfrn: "XP001", isActive: true }
            ]);
            console.log("✅ Seeded Fuel Products");
        }

        // 2. Check Daily Rates
        const rates = await DailySaleRate.find({});
        console.log(`Daily Rates found: ${rates.length}`);
        rates.forEach(r => console.log(` - ${r.rateDate} | Product: ${r.fuelProductId} | Open: ${r.openRate} | Close: ${r.closeRate}`));

        await mongoose.disconnect();

    } catch (e) {
        console.error("Error:", e);
    }
}

checkDailyRates();
