
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Tenant } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function fixTestAuth() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri || !mongoUri.includes('/test')) {
            throw new Error("MONGODB_URI is not pointing to 'test' database. Please check .local.env");
        }

        console.log(`Connecting to MongoDB (test)...`);
        await mongoose.connect(mongoUri);

        const email = 'admin@example.com';
        const password = 'password123';

        // 1. Fix User
        let user = await User.findOne({ email });
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        if (user) {
            console.log("Found user. Updating password...");
            user.passwordHash = hash;
            user.status = 'active';
            user.roles = ['super_admin'];
            await user.save();
            console.log("✅ User password reset to 'password123'");
        } else {
            console.log("User not found. Creating...");
            user = new User({
                email: email,
                username: 'admin',
                passwordHash: hash,
                fullName: 'System Admin',
                roles: ['super_admin'],
                status: 'active'
            });
            await user.save();
            console.log("✅ User created.");
        }

        // 2. Ensure Tenant
        const tenantCount = await Tenant.countDocuments();
        if (tenantCount === 0) {
            console.log("No tenant found. Creating...");
            const tenant = new Tenant({
                organizationName: 'Test Organization',
                superAdminEmail: email,
                status: 'active'
            });
            await tenant.save();
            console.log("✅ Tenant created.");
        } else {
            console.log(`✅ Tenant exists (${tenantCount} found).`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

fixTestAuth();
