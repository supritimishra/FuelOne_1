
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

// Load env
config({ path: path.resolve(process.cwd(), '.local.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
}

async function listDatabases() {
    try {
        console.log("Connecting to MongoDB Cluster...");
        await mongoose.connect(uri!);
        console.log("Connected.");

        // Use the native driver admin interface to list databases
        const admin = mongoose.connection.db.admin();
        const result = await admin.listDatabases();

        console.log("\n📦 AVAILABLE DATABASES:");
        for (const dbInfo of result.databases) {
            console.log(` - ${dbInfo.name} \t(Size: ${dbInfo.sizeOnDisk} bytes)`);
        }

        console.log("\n🔍 SEARCHING FOR USERS IN EACH DB:");

        // Check "users" collection in each database
        for (const dbInfo of result.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            // Switch database
            const db = mongoose.connection.useDb(dbName);
            const userCount = await db.collection('users').countDocuments();

            console.log(`\nChecking DB: '${dbName}'`);
            console.log(`   Found ${userCount} documents in 'users' collection.`);

            if (userCount > 0) {
                const users = await db.collection('users').find({}).limit(5).toArray();
                users.forEach(u => console.log(`   👉 User: ${u.email}`));
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

listDatabases();
