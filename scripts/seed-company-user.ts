
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function seed() {
    if (!MONGO_URI) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db!;
        const tenantsColl = db.collection('tenants');
        const usersColl = db.collection('users');
        const productsColl = db.collection('fuelproducts');
        const customersColl = db.collection('creditcustomers');
        const vendorsColl = db.collection('vendors');
        const employeesColl = db.collection('employees');

        const email = 'Jay@gmail.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create/Find Tenant
        let tenant = await tenantsColl.findOne({ superAdminEmail: email.toLowerCase() });
        let tenantIdStr = '';

        if (!tenant) {
            const res = await tenantsColl.insertOne({
                organizationName: 'FuelOne Company',
                superAdminEmail: email.toLowerCase(),
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            tenantIdStr = res.insertedId.toString();
            console.log(`✅ Created fresh company tenant: ${tenantIdStr}`);
        } else {
            tenantIdStr = tenant._id.toString();
            console.log(`✅ Using existing company tenant: ${tenantIdStr}`);
        }

        // 2. Upsert User Jay
        await usersColl.updateOne(
            { email: email.toLowerCase() },
            {
                $set: {
                    username: 'jay',
                    fullName: 'Jay (Company Admin)',
                    passwordHash: hashedPassword,
                    tenantId: tenantIdStr,
                    role: 'super_admin',
                    isActive: true,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
        console.log(`✅ User ${email} seeded/updated`);

        // 3. Seed Fuel Products if missing
        const productCount = await productsColl.countDocuments({ tenantId: tenantIdStr });
        if (productCount === 0) {
            await productsColl.insertMany([
                { tenantId: tenantIdStr, productName: "High Speed Diesel", shortName: "HSD", salesType: "Fuel", isActive: true, createdAt: new Date() },
                { tenantId: tenantIdStr, productName: "Motor Spirit", shortName: "MS", salesType: "Fuel", isActive: true, createdAt: new Date() },
                { tenantId: tenantIdStr, productName: "Xtra Premium", shortName: "XP", salesType: "Fuel", isActive: true, createdAt: new Date() }
            ]);
            console.log('✅ Seeded default Fuel Products (HSD, MS, XP)');
        }

        // 4. Seed basic Customer for Business Transactions
        const custCount = await customersColl.countDocuments({ tenantId: tenantIdStr });
        if (custCount === 0) {
            await customersColl.insertOne({
                tenantId: tenantIdStr,
                organizationName: "General Credit Customer",
                contactPerson: "Test Person",
                phone: "0000000000",
                isActive: true,
                createdAt: new Date()
            });
            console.log('✅ Seeded default Credit Customer');
        }

        // 5. Seed basic Vendor for Vendor Transactions
        const vendorCount = await vendorsColl.countDocuments({ tenantId: tenantIdStr });
        if (vendorCount === 0) {
            await vendorsColl.insertOne({
                tenantId: tenantIdStr,
                vendorName: "Main Fuel Supplier",
                contactPerson: "Supplier Agent",
                phone: "1111111111",
                isActive: true,
                createdAt: new Date()
            });
            console.log('✅ Seeded default Vendor');
        }

        // 6. Seed basic Employee
        const empCount = await employeesColl.countDocuments({ tenantId: tenantIdStr });
        if (empCount === 0) {
            await employeesColl.insertOne({
                tenantId: tenantIdStr,
                fullName: "Standard Operator",
                designation: "Operator",
                isActive: true,
                createdAt: new Date()
            });
            console.log('✅ Seeded default Employee');
        }

        // Update Tenant with superAdminUserId
        const jay = await usersColl.findOne({ email: email.toLowerCase() });
        if (jay) {
            await tenantsColl.updateOne({ _id: new mongoose.Types.ObjectId(tenantIdStr) as any }, { $set: { superAdminUserId: jay._id.toString() } });
        }

        await mongoose.disconnect();
        console.log('\n🚀 ALL DONE. Master data & User seeded.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
