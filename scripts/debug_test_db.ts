
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function debugTestDb() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI missing");

        console.log("Connecting...");
        await mongoose.connect(uri);

        console.log("\n--- Checking 'test' database ---");
        // Explicitly switch to 'test' database
        const testDb = mongoose.connection.useDb('test');

        const collections = await testDb.db.listCollections().toArray();
        console.log("Collections in 'test':", collections.map(c => c.name).join(', '));

        const count = await testDb.collection('employees').countDocuments();
        console.log(`count('employees') in test: ${count}`);

        if (count > 0) {
            const all = await testDb.collection('employees').find({}).toArray();
            console.log(`Found ${count} employees:`);
            all.forEach(e => {
                console.log(` - ${e.employeeName} (isActive: ${e.isActive})`);
            });
        } else {
            console.log("No employees in 'test' database.");
        }

        await mongoose.disconnect();

    } catch (e) {
        console.error("Error:", e);
    }
}

debugTestDb();
