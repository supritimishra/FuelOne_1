const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://syntropylabworks_db_user:QArml7uLnqqg496U@cluster0.zlqfhe8.mongodb.net/admin";

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB:", MONGODB_URI);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        console.log("\n--- DATABASES FOUND ---");
        dbs.databases.forEach(db => console.log(`DB: ${db.name} (${db.sizeOnDisk} bytes)`));
        console.log("-----------------------\n");

        const sortedDbs = dbs.databases.sort((a, b) => (a.name === 'test' ? -1 : 1));

        for (const dbInfo of sortedDbs) {
            if (dbInfo.sizeOnDisk > 0 && ['admin', 'local', 'config'].indexOf(dbInfo.name) === -1) {
                console.log(`\nInspecting DB: [${dbInfo.name}]`);
                const db = mongoose.connection.client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                const colNames = collections.map(c => c.name);
                console.log(`Collections (${colNames.length}): ${colNames.join(', ')}`);

                // Check specific collections for user data
                const checkCols = ['users', 'shiftsheets', 'vendors', 'businesstransactions', 'creditcustomers'];
                for (const check of checkCols) {
                    if (colNames.includes(check)) {
                        const count = await db.collection(check).countDocuments();
                        console.log(`  -> ${check}: ${count} docs`);
                    }
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
