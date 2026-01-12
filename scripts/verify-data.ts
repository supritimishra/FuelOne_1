
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function verify() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI missing');

    await mongoose.connect(uri);
    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const products = await db.collection('fuelproducts').find({}).toArray();
    console.log('Fuel Products found:', products.length);
    products.forEach(p => console.log(` - ${p.shortName} (${p.productName})`));

    await mongoose.disconnect();
}

verify().catch(console.error);
