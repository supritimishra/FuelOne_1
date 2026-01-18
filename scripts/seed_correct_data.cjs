const mongoose = require('mongoose');
require('dotenv').config({ path: '.local.env' });

async function seedData() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is missing in .local.env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const customerSchema = new mongoose.Schema({}, { strict: false });
        const CreditCustomer = mongoose.model('CreditCustomer', customerSchema, 'creditcustomers');

        const tenantId = "f1f5c217-7b39-4031-9d76-b7da090bad65"; // The user's tenant ID

        const newCustomer = {
            organizationName: "Test Organization (Fixed)",
            mobileNumber: "9999999999",
            creditLimit: 50000,
            openingBalance: 12000,
            isActive: true,
            tenantId: tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await CreditCustomer.create(newCustomer);
        console.log("Seeded customer:", result);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

seedData();
