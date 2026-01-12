
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const users = await mongoose.connection.db!.collection('users').find({}).toArray();
        console.log('--- USERS IN MONGODB ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Username: ${u.username}, Active: ${u.isActive}`);
        });
        console.log('------------------------');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
