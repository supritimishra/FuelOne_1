
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

const COLLECTIONS = [
    'saleentries',
    'dutyshifts'
];

async function migrateMoreData() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("Missing URI");

        const baseUri = uri.substring(0, uri.lastIndexOf('/'));
        const fueloneUri = `${baseUri}/fuelone`;
        const testUri = `${baseUri}/test`;

        console.log("Migration (SaleEntries/Shifts): Test -> FuelOne");

        const connTest = await mongoose.createConnection(testUri).asPromise();
        const connFuel = await mongoose.createConnection(fueloneUri).asPromise();

        for (const col of COLLECTIONS) {
            console.log(`Migrating ${col}...`);
            const docs = await connTest.collection(col).find({}).toArray();
            if (docs.length === 0) {
                console.log(` - No docs in ${col} (Test)`);
                continue;
            }

            let inserted = 0;
            let skipped = 0;

            for (const doc of docs) {
                const existing = await connFuel.collection(col).findOne({ _id: doc._id });
                if (!existing) {
                    await connFuel.collection(col).insertOne(doc);
                    inserted++;
                } else {
                    skipped++;
                }
            }
            console.log(` - ${col}: Inserted ${inserted}, Skipped ${skipped}`);
        }

        await connTest.close();
        await connFuel.close();
        console.log("Migration Done.");

    } catch (e) {
        console.error(e);
    }
}

migrateMoreData();
