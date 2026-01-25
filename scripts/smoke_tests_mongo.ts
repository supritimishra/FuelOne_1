import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import {
    FuelProduct,
    CreditCustomer,
    GuestSale,
    Employee,
    Tenant,
    User
} from '../server/models.js';

// Load .env
config({ path: path.resolve(process.cwd(), '.env') });

const log = (...args: any[]) => console.log(new Date().toISOString(), ...args);

async function runSmokeTests() {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI missing in .env');
        process.exit(1);
    }

    try {
        log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        log('✅ Connected to MongoDB');

        const testId = `smoke_${Date.now()}`;
        const cleanups: Array<() => Promise<void>> = [];

        // 1. Fuel Product Test
        log('🧪 Testing Fuel Product creation...');
        const product = await FuelProduct.create({
            _id: testId,
            productName: `Smoke Test Fuel ${testId}`,
            shortName: 'SMOKE',
            lfrn: '1234',
            isActive: true
        });
        log('✅ Fuel Product created:', product._id);
        cleanups.push(() => FuelProduct.findByIdAndDelete(testId).then(() => log('🧹 Fuel Product cleaned')));

        // 2. Employee Test
        log('🧪 Testing Employee creation...');
        const emp = await Employee.create({
            _id: testId,
            employeeName: 'Smoke Test Emp',
            joinDate: new Date(),
            designation: 'Tester',
            salaryType: 'Per Month',
            salary: 10000,
            isActive: true
        });
        log('✅ Employee created:', emp._id);
        cleanups.push(() => Employee.findByIdAndDelete(testId).then(() => log('🧹 Employee cleaned')));

        // 3. Credit Customer Test
        log('🧪 Testing Credit Customer creation...');
        const customer = await CreditCustomer.create({
            _id: testId,
            organizationName: `Smoke Corp ${testId}`,
            phoneNumber: '1234567890',
            creditLimit: 5000,
            isActive: true
        });
        log('✅ Credit Customer created:', customer._id);
        cleanups.push(() => CreditCustomer.findByIdAndDelete(testId).then(() => log('🧹 Credit Customer cleaned')));

        // 4. Guest Sale Test (Transaction)
        log('🧪 Testing Guest Sale creation...');
        const sale = await GuestSale.create({
            saleDate: new Date(),
            customerName: 'Guest Tester',
            fuelProductId: testId, // Link to created product
            quantity: 10,
            pricePerUnit: 100,
            totalAmount: 1000,
            paymentMode: 'Cash',
            status: 'active'
        });
        log('✅ Guest Sale created:', sale._id);
        cleanups.push(() => GuestSale.findByIdAndDelete(sale._id).then(() => log('🧹 Guest Sale cleaned')));

        // 5. Verification Read
        log('🔍 Verifying persistence...');
        const foundProduct = await FuelProduct.findById(testId);
        if (!foundProduct) throw new Error('Failed to retrieve Fuel Product');
        log('✅ Persistence verified');

        // Cleanup
        log('🧹 Starting cleanup...');
        for (const cleanup of cleanups.reverse()) {
            await cleanup();
        }

        log('🎉 All Smoke Tests Passed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Smoke Test Failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runSmokeTests();
