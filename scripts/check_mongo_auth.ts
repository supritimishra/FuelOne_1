
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

// Define minimal schemas for checking
const UserSchema = new mongoose.Schema({ email: String, username: String, status: String }, { strict: false });
const User = mongoose.model('User', UserSchema);

const TenantSchema = new mongoose.Schema({ organizationName: String, superAdminEmail: String, status: String }, { strict: false });
const Tenant = mongoose.model('Tenant', TenantSchema);

async function checkAuthData() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri!);
        console.log("Connected.");

        const users = await User.find({});
        console.log(`\nFound ${users.length} Users:`);
        users.forEach(u => console.log(` - ID: ${u._id}, Email: ${u.email}, Username: ${u.username}, Status: ${u.status}`));

        const tenants = await Tenant.find({});
        console.log(`\nFound ${tenants.length} Tenants:`);
        tenants.forEach(t => console.log(` - ID: ${t._id}, Org: ${t.organizationName}, AdminEmail: ${t.superAdminEmail}, Status: ${t.status}`));

        if (users.length === 0) {
            console.log("\n⚠️ NO USERS FOUND. You cannot log in.");
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

checkAuthData();
