const mongoose = require('mongoose');
require('dotenv').config({ path: '.local.env' });

async function checkCreditCustomers() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI is missing in .local.env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // generic schema to read any collection
        const customerSchema = new mongoose.Schema({}, { strict: false });
        const CreditCustomer = mongoose.model('CreditCustomer', customerSchema, 'creditcustomers'); // verifying collection name, usually plural lowercase or matching model

        const count = await CreditCustomer.countDocuments();
        console.log(`Total Credit Customers found: ${count}`);

        const fs = require('fs');
        if (count > 0) {
            const customers = await CreditCustomer.find({}, 'organizationName tenantId').limit(5);
            let output = "--- CUSTOMER DATA CHECK ---\n";
            customers.forEach((c, i) => {
                output += `[${i}] Org: ${c.organizationName}, TenantID: ${c.tenantId}\n`;
            });
            output += "---------------------------\n";
            fs.writeFileSync('scripts/db_output.txt', output);
            console.log("Output written to scripts/db_output.txt");
        } else {
            fs.writeFileSync('scripts/db_output.txt', "No customers found.");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkCreditCustomers();
