
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function checkUsers() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI missing");

        console.log("Connecting...");
        // Append /test just for this check (simplistic replacement)
        const testUri = uri.replace(/\/[^/]+$/, '/test');
        console.log("URI:", testUri.replace(/:([^:@]+)@/, ':****@'));

        await mongoose.connect(testUri);

        const userCount = await mongoose.connection.collection('users').countDocuments();
        console.log(`Users in 'test': ${userCount}`);

        const users = await mongoose.connection.collection('users').find({}).limit(5).toArray();
        users.forEach(u => console.log(` - ${u.email} (status: ${u.status})`));

        await mongoose.disconnect();

    } catch (e) {
        console.error("Error:", e);
    }
}

checkUsers();
