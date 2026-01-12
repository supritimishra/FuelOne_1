
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function verify() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri!);
    const db = mongoose.connection.db!;
    const hsd = await db.collection('fuelproducts').findOne({ shortName: 'HSD' });
    const ms = await db.collection('fuelproducts').findOne({ shortName: 'MS' });
    const xp = await db.collection('fuelproducts').findOne({ shortName: 'XP' });
    console.log('HSD:', !!hsd);
    console.log('MS:', !!ms);
    console.log('XP:', !!xp);
    await mongoose.disconnect();
}
verify();
