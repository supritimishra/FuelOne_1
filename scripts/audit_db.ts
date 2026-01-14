
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

const COLLECTIONS = [
    'interesttransactions',
    'sheetrecords',
    'daycashmovements',
    'tankersales',
    'guestsales',
    'attendances',
    'dutypayrecords',
    'salesofficerinspections',
    'creditrequests',
    'expiryitems',
    'feedbacks'
];

async function auditData() {
    try {
        const uri = process.env.MONGODB_URI; // Pointing to fuelone currently
        if (!uri) throw new Error("Missing URI");

        const baseUri = uri.substring(0, uri.lastIndexOf('/'));
        const fueloneUri = `${baseUri}/fuelone`;
        const testUri = `${baseUri}/test`;

        const connTest = await mongoose.createConnection(testUri).asPromise();
        const connFuel = await mongoose.createConnection(fueloneUri).asPromise();

        console.log("Collection Audit (Test vs FuelOne):");
        console.log("-----------------------------------");

        for (const col of COLLECTIONS) {
            const countTest = await connTest.collection(col).countDocuments();
            const countFuel = await connFuel.collection(col).countDocuments();
            console.log(`${col.padEnd(25)} | Test: ${countTest.toString().padEnd(5)} | FuelOne: ${countFuel}`);
        }

        await connTest.close();
        await connFuel.close();

    } catch (e) {
        console.error(e);
    }
}

auditData();
