const mongoose = require('mongoose');
require('dotenv').config({ path: '.local.env' });

async function checkTenantData() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is missing");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);

        const tenantId = "f1f5c217-7b39-4031-9d76-b7da090bad65"; // User's verified tenant ID
        console.log(`Checking data for Tenant: ${tenantId}\n`);

        const collections = [
            { name: 'ShiftSheet', collection: 'shiftsheets' }, // Verify collection names!
            { name: 'BusinessTransaction', collection: 'businesstransactions' },
            { name: 'VendorTransaction', collection: 'vendortransactions' },
            { name: 'CreditCustomer', collection: 'creditcustomers' } // We expect 1 here
        ];

        for (const col of collections) {
            const Model = mongoose.model(col.name, new mongoose.Schema({}, { strict: false }), col.collection);
            const count = await Model.countDocuments({ tenantId: tenantId });
            console.log(`${col.name}: ${count} records`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkTenantData();
