
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function debugMongo() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI missing");

        // The URI in .env is likely ".../fuelone". We want to see all DBs.
        // We can connect to the admin database or just the base URI to list databases if user has permission.
        // Let's rely on the driver to list databases.

        console.log("Connecting to:", uri.replace(/:([^:@]+)@/, ':****@'));
        const client = await mongoose.connect(uri);

        // Use the native driver/admin interface to list databases
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const listDatabases = await admin.listDatabases();
        console.log("\nDatabases in Cluster:");
        console.log(listDatabases.databases.map((d: any) => ` - ${d.name} (size: ${d.sizeOnDisk})`).join('\n'));

        // Check 'fuelone' database collections
        console.log("\n--- Checking 'fuelone' database ---");
        const fueloneDb = mongoose.connection.useDb('fuelone');
        const fueloneCollections = await fueloneDb.db.listCollections().toArray();
        console.log("Collections:", fueloneCollections.map(c => c.name).join(', '));

        // Check count of employees in fuelone
        const fueloneEmployees = await fueloneDb.collection('employees').countDocuments();
        console.log(`count('employees'): ${fueloneEmployees}`);
        if (fueloneEmployees > 0) {
            const sample = await fueloneDb.collection('employees').findOne();
            console.log("Sample:", JSON.stringify(sample, null, 2));
        }

        // Check 'test' database collections
        console.log("\n--- Checking 'test' database ---");
        const testDb = mongoose.connection.useDb('test');
        const testCollections = await testDb.db.listCollections().toArray();
        console.log("Collections:", testCollections.map(c => c.name).join(', '));

        // Check count of employees in test
        const testEmployees = await testDb.collection('employees').countDocuments();
        console.log(`count('employees'): ${testEmployees}`);
        if (testEmployees > 0) {
            const sample = await testDb.collection('employees').findOne();
            console.log("Sample:", JSON.stringify(sample, null, 2));
        }

        await mongoose.disconnect();

    } catch (e) {
        console.error("Error:", e);
    }
}

debugMongo();
