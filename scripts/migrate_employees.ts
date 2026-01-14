
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables to get the base URI
dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function migrateEmployees() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI missing");

        // The URI in .env might be pointing to 'test' or 'fuelone' right now.
        // We will construct explicit URIs for both.
        // Assuming URI format: mongodb+srv://user:pass@cluster.net/dbName

        const baseUri = uri.substring(0, uri.lastIndexOf('/'));
        const testUri = `${baseUri}/test`;
        const fueloneUri = `${baseUri}/fuelone`;

        console.log("Migration Source (Test):", testUri.replace(/:([^:@]+)@/, ':****@'));
        console.log("Migration Target (FuelOne):", fueloneUri.replace(/:([^:@]+)@/, ':****@'));

        // 1. Fetch from Test
        const testConn = await mongoose.createConnection(testUri).asPromise();
        console.log("Connected to Source (Test).");

        // Define simple schema/model for reading
        const EmployeeSchema = new mongoose.Schema({ _id: String }, { strict: false });
        const TestEmployee = testConn.model('Employee', EmployeeSchema);

        const employeesToMigrate = await TestEmployee.find({});
        console.log(`Found ${employeesToMigrate.length} employees in Test DB.`);

        if (employeesToMigrate.length === 0) {
            console.log("No employees to migrate.");
            await testConn.close();
            return;
        }

        // 2. Insert into FuelOne
        const fueloneConn = await mongoose.createConnection(fueloneUri).asPromise();
        console.log("Connected to Target (FuelOne).");

        const TargetEmployee = fueloneConn.model('Employee', EmployeeSchema);

        let count = 0;
        for (const emp of employeesToMigrate) {
            const empObj = emp.toObject();

            // Check if exists
            const existing = await TargetEmployee.findById(empObj._id);
            if (!existing) {
                await TargetEmployee.create(empObj);
                console.log(` - Migrated: ${empObj.employeeName}`);
                count++;
            } else {
                console.log(` - Skipped (Already Exists): ${empObj.employeeName}`);
                // Optional: Update if needed, but for now just skip to preserve any custom data
            }
        }

        console.log(`Migration Complete. Moved ${count} employees.`);

        await testConn.close();
        await fueloneConn.close();

    } catch (e) {
        console.error("Migration Error:", e);
    }
}

migrateEmployees();
