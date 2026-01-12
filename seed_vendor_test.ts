import { connectToMongo } from './server/db-mongo.js';
import { Vendor } from './server/models/VendorTransaction.js';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

(async () => {
    await connectToMongo();

    // Check if any vendor exists
    const count = await Vendor.countDocuments();
    if (count === 0) {
        console.log("Creating default vendor...");
        await Vendor.create({
            vendorName: "Indian Oil Corp",
            vendorType: "Liquid",
            isActive: true
        });
        console.log("Default vendor created.");
    } else {
        console.log("Vendors already exist.");
    }

    const v = await Vendor.findOne();
    console.log("Vendor ID:", v._id.toString());

    process.exit(0);
})();
