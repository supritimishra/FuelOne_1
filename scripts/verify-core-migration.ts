
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = 'http://localhost:5001/api';
const MONGO_URI = process.env.MONGODB_URI as string;

if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not found in .local.env');
    process.exit(1);
}

async function runVerification() {
    console.log('🧪 Starting Core Modules Verification (Standalone)...');
    console.log(`📡 Connecting to MongoDB at ${MONGO_URI.split('@')[1] || '...'}`);

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Setup Data via API
        const uniqueId = Date.now();
        const email = `verify_${uniqueId}@test.local`;

        console.log(`\n👤 Registering user: ${email}`);

        let token = '';
        let tenantId = '';

        try {
            const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                email,
                password: 'password123',
                username: `user_${uniqueId}`,
                fullName: 'Verify User',
                organizationName: `Verify Org ${uniqueId}`
            });

            const cookie = regRes.headers['set-cookie']?.[0];
            token = cookie?.split(';')[0].split('=')[1] || '';
            tenantId = regRes.data.tenant.id;
            console.log(`✅ Registered. Tenant: ${tenantId}`);
        } catch (e: any) {
            console.error('❌ Registration failed:', e.response?.data || e.message);
            process.exit(1);
        }

        const headers = { Cookie: `token=${token}` };
        const db = mongoose.connection.db!;

        // ---------------------------------------------------------
        // MODULE 1: SHIFT SHEET ENTRY (Daily Rates)
        // ---------------------------------------------------------
        console.log('\n⛽ Testing Shift Sheet Entry (Daily Rates)...');
        // Ensure products exist (auto-seeded by GET)
        await axios.get(`${BASE_URL}/fuel-products`, { headers });

        const date = new Date().toISOString().slice(0, 10);
        const ratePayload = {
            date,
            shift: 'S-1',
            rates: [
                { fuelProductId: 'HSD', openRate: 90.5, closeRate: 90.5 },
                { fuelProductId: 'MS', openRate: 102.3, closeRate: 102.3 }
            ]
        };

        const rateRes = await axios.post(`${BASE_URL}/daily-rates`, ratePayload, { headers });
        console.log('   POST /daily-rates status:', rateRes.status);

        // Verify Persistence via Direct Mongo Query
        const ratesColl = db.collection('dailysalerates');
        const savedRate = await ratesColl.findOne({ tenantId, date, shift: 'S-1' });

        if (savedRate) {
            console.log('   ✅ verified persistence in MongoDB (dailysalerates collection)');
        } else {
            console.error('   ❌ Failed to persist DailySaleRate');
            process.exit(1);
        }

        // ---------------------------------------------------------
        // MODULE 2: BUSINESS TRANSACTIONS
        // ---------------------------------------------------------
        console.log('\n💼 Testing Business Transactions...');

        // Create Customer
        console.log('   Creating mock credit customer...');
        const custColl = db.collection('creditcustomers');
        const cust = await custColl.insertOne({
            tenantId,
            name: 'Test Customer',
            mobile: '1234567890',
            vehicleNumber: 'KA-01-AB-1234',
            creditLimit: 50000,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const customerId = cust.insertedId.toString();

        const trxPayload = {
            transaction_date: date,
            party_name: 'Test Customer',
            transaction_type: 'Credit',
            amount: 5000,
            description: 'Fuel Credit'
        };

        const trxRes = await axios.post(`${BASE_URL}/business-transactions`, trxPayload, { headers });
        console.log('   POST /business-transactions status:', trxRes.status);

        // Verify Persistence
        const btColl = db.collection('businesstransactions');
        const savedTrx = await btColl.findOne({ tenantId, transactionType: 'Credit', amount: 5000 });

        if (savedTrx) {
            console.log('   ✅ verified persistence in MongoDB (businesstransactions collection)');
        } else {
            console.error('   ❌ Failed to persist BusinessTransaction');
            process.exit(1);
        }

        // ---------------------------------------------------------
        // MODULE 3: VENDOR TRANSACTIONS
        // ---------------------------------------------------------
        console.log('\n🚚 Testing Vendor Transactions...');

        // Create Vendor (Via API)
        const vendRes = await axios.post(`${BASE_URL}/vendors`, {
            vendorName: 'Test Oil Co',
            vendorType: 'Liquid'
        }, { headers });

        // Get Vendor ID from DB
        const vendorColl = db.collection('vendors');
        const vendor = await vendorColl.findOne({ tenantId, vendorName: 'Test Oil Co' });
        const vendorId = vendor?._id.toString();

        const vTrxPayload = {
            transaction_date: date,
            vendor_id: vendorId,
            transaction_type: 'Debit',
            amount: 150000,
            payment_mode: 'Bank',
            description: 'Load Payment'
        };

        const vTrxRes = await axios.post(`${BASE_URL}/vendor-transactions`, vTrxPayload, { headers });
        console.log('   POST /vendor-transactions status:', vTrxRes.status);

        // Verify Persistence
        const vtColl = db.collection('vendortransactions');
        const savedVTrx = await vtColl.findOne({ tenantId, vendorId: new mongoose.Types.ObjectId(vendorId) });

        if (savedVTrx) {
            console.log('   ✅ verified persistence in MongoDB (vendortransactions collection)');
        } else {
            console.error('   ❌ Failed to persist VendorTransaction');
            process.exit(1);
        }

        console.log('\n🎉 ALL CORE MODULES VERIFIED SUCCESSFULLY ON MONGODB');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Verification Failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.status, error.response.data);
        }
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Run
runVerification();
