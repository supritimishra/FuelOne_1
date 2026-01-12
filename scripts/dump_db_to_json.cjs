const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Try to load env if possible, otherwise use default
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/FuelOne";

async function inspect() {
    const report = {
        uri: MONGODB_URI,
        databases: []
    };

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to:", MONGODB_URI);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        for (const dbInfo of dbs.databases) {
            // Skip system DBs
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;

            const dbReport = {
                name: dbInfo.name,
                collections: []
            };

            console.log(`Scanning DB: ${dbInfo.name}`);
            const db = mongoose.connection.client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();

            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                const sample = await db.collection(col.name).find({}).limit(5).toArray();

                dbReport.collections.push({
                    name: col.name,
                    count: count,
                    sample: sample
                });
            }
            report.databases.push(dbReport);
        }

        fs.writeFileSync('db_dump.json', JSON.stringify(report, null, 2));
        console.log("Dump saved to db_dump.json");

    } catch (e) {
        console.error("Error:", e);
        fs.writeFileSync('db_dump_error.json', JSON.stringify({ error: e.message }, null, 2));
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
