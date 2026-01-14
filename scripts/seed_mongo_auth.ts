
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load env
config({ path: path.resolve(process.cwd(), '.local.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
}

// Reuse schemas from checking script but add password hash
const UserSchema = new mongoose.Schema({
    email: String,
    username: String,
    passwordHash: String,
    fullName: String,
    roles: [String],
    status: { type: String, default: 'active' }
}, { strict: false, timestamps: true });
const User = mongoose.model('User', UserSchema);

const TenantSchema = new mongoose.Schema({
    organizationName: String,
    superAdminEmail: String,
    superAdminUserId: String,
    status: { type: String, default: 'active' },
    connectionString: String
}, { strict: false, timestamps: true });
const Tenant = mongoose.model('Tenant', TenantSchema);

async function seedAuth() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri!);
        console.log("Connected.");

        // Check if exists
        const email = 'admin@example.com';
        const password = 'password123';

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User admin@example.com already exists.");

            // Fix password just in case
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            existingUser.passwordHash = hash;
            existingUser.status = 'active';
            await existingUser.save();
            console.log("✅ Reset password to 'password123'");
            return;
        }

        console.log("Creating new tenant and user...");

        // 1. Create Tenant
        const tenant = new Tenant({
            organizationName: 'Demo Organization',
            superAdminEmail: email,
            status: 'active',
            connectionString: 'mongodb' // Placeholder
        });
        await tenant.save();
        console.log(`✅ Tenant created: ${tenant._id}`);

        // 2. Create User
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = new User({
            email: email,
            username: 'admin',
            passwordHash: hash,
            fullName: 'System Admin',
            roles: ['super_admin'],
            status: 'active'
        });
        await user.save();
        console.log(`✅ User created: ${user._id}`);

        // Link user to tenant
        tenant.superAdminUserId = user._id.toString();
        await tenant.save();
        console.log("✅ Linked user to tenant.");

        console.log("\n🎉 LOGIN DETAILS:");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

seedAuth();
