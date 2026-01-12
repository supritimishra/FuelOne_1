const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://localhost:27017/admin";

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB:", MONGODB_URI);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        console.log("\nDatabases:");
        dbs.databases.forEach(db => console.log(` - ${db.name} (Size: ${db.sizeOnDisk})`));

        for (const dbInfo of dbs.databases) {
            if (dbInfo.sizeOnDisk > 0 && dbInfo.name !== 'admin' && dbInfo.name !== 'local' && dbInfo.name !== 'config') {
                console.log(`\nChecking DB: ${dbInfo.name}...`);
                const db = mongoose.connection.client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);

                const empCol = collections.find(c => c.name.toLowerCase().includes('employee'));
                if (empCol) {
                    console.log(`  SUCCESS! Found likely employees collection: ${empCol.name}`);
                    const count = await db.collection(empCol.name).countDocuments();
                    console.log(`  Count: ${count}`);
                    const sample = await db.collection(empCol.name).find({}).limit(5).toArray();
                    console.log("  Sample Data:", JSON.stringify(sample, null, 2));
                }
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
