const mongoose = require('mongoose');
require('dotenv').config({ path: '.local.env' });

const tenantId = "f1f5c217-7b39-4031-9d76-b7da090bad65";

async function seedMongo() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is missing");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to MongoDB. Seeding for Tenant: ${tenantId}`);

        // --- 1. Shift Sheets ---
        console.log("Seeding Shift Sheets...");
        const ShiftSheet = mongoose.model('ShiftSheet', new mongoose.Schema({}, { strict: false }), 'shiftsheets');
        await ShiftSheet.create([
            {
                tenantId,
                shiftDate: new Date().toISOString().slice(0, 10),
                shiftType: "Morning",
                handoverTo: "Ramesh",
                openingCash: 5000,
                status: "Pending",
                createdAt: new Date()
            },
            {
                tenantId,
                shiftDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // Yesterday
                shiftType: "Evening",
                handoverTo: "Suresh",
                openingCash: 12000,
                status: "Completed",
                createdAt: new Date(Date.now() - 86400000)
            }
        ]);

        // --- 2. Vendors ---
        console.log("Seeding Vendors...");
        const Vendor = mongoose.model('Vendor', new mongoose.Schema({}, { strict: false }), 'vendors');
        const vendor1 = await Vendor.create({
            tenantId,
            vendorName: "Indian Oil Corp",
            vendorType: "Fuel",
            mobileNumber: "9876543210",
            isActive: true
        });
        const vendor2 = await Vendor.create({
            tenantId,
            vendorName: "Local Snacks Supplier",
            vendorType: "Inventory",
            mobileNumber: "9876543211",
            isActive: true
        });

        // --- 3. Vendor Transactions ---
        console.log("Seeding Vendor Transactions...");
        const VendorTransaction = mongoose.model('VendorTransaction', new mongoose.Schema({}, { strict: false }), 'vendortransactions');
        await VendorTransaction.create([
            {
                tenantId,
                vendorId: vendor1._id,
                transactionType: "Debit",
                amount: 50000,
                transactionDate: new Date().toISOString().slice(0, 10),
                description: "Fuel Load Payment",
                paymentMode: "Bank"
            },
            {
                tenantId,
                vendorId: vendor2._id,
                transactionType: "Credit",
                amount: 2000,
                transactionDate: new Date().toISOString().slice(0, 10),
                description: "Snacks Purchase",
                paymentMode: "Cash"
            }
        ]);

        // --- 4. Business Transactions ---
        console.log("Seeding Business Transactions...");
        const BusinessTransaction = mongoose.model('BusinessTransaction', new mongoose.Schema({}, { strict: false }), 'businesstransactions');
        await BusinessTransaction.create([
            {
                tenantId,
                transactionType: "Expense",
                amount: 500,
                description: "Tea & Refreshments",
                date: new Date().toISOString().slice(0, 10),
                category: "Office"
            },
            {
                tenantId,
                transactionType: "Income",
                amount: 15000,
                description: "Scrap Sale",
                date: new Date().toISOString().slice(0, 10),
                category: "Misc"
            }
        ]);

        console.log("✅ Seeding completed! Data restored for Shift Sheets, Vendors, Business Trx.");
        await mongoose.disconnect();

    } catch (error) {
        console.error("Error:", error);
    }
}

seedMongo();
