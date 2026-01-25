
import axios from 'axios';
import { config } from 'dotenv';
import path from 'path';

// Load env
config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5001}/api/reports`;
const AUTH_URL = `http://localhost:${process.env.PORT || 5001}/api/auth/login`;

// Mock credentials - Assuming these exist from previous conversations or I can default to a known user if I knew one.
// I will try to login with a known dev user or just skip if I can't.
// Wait, I need a token to hit /api/reports. 
// I'll try to use a hardcoded dev token if possible, or login.
// Since I don't have clear credentials, I'll assume I can use a test user created in previous steps or just try a standard one.
// Actually, I can use the `developer-mode` to get a token if enabled, or just try to hit endpoints if auth is disabled for dev (it's not).

async function runTests() {
    console.log('🚀 Starting Reports Verification...');

    const token = '';
    // Use the existing TestSprite bypass found in server/auth.ts
    const headers: any = {
        'x-test-user': 'TestSprite',
        'Authorization': 'Bearer ' // Empty bearer might be needed if logic requires it presence, but code says "OR"
    };

    // Check if we need to set Authorization header to something non-empty to pass the "if (!token)" check if it checks both
    // server/auth.ts line 65: if (!token) ...
    // And token comes from: req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    // So we should provide a dummy token to pass that check, even if we rely on x-test-user for the payload.
    // Wait, line 55 checks testUser BEFORE line 65 check for token?
    // Lines 55-63: if (testUser === 'TestSprite') { ... return next(); }
    // So if we send x-test-user, we return next() immediately and skip the token check!
    // Perfect. We don't need a token.

    const endorsements = [
        '/all-credit-customers',
        '/attendance',
        '/business-transactions',
        '/bowser-transactions',
        '/bowser-day',
        '/customer-account-statement?organization=1',
        '/product-rate',
        '/dsr',
        '/dsr-format',
        '/day-stock-value',
        '/daily-business-summary?date=2023-01-01',
        '/expenditure',
        '/gst-purchases',
        '/gst-sales',
        '/tcs',
        '/tds',
        '/vat',
        '/lfr',
        '/guest-customer',
        '/lubricants-stock',
        '/product-purchases',
        '/employee-status',
        '/sales',
        '/stock-variation',
        '/swipe',
        '/vendor-transactions',
        '/feedback',
        '/interest-transactions'
    ];

    for (const endpoint of endorsements) {
        try {
            const url = `${BASE_URL}${endpoint}`;
            const res = await axios.get(url, { headers, validateStatus: () => true });

            if (res.status === 200 && res.data.ok) {
                console.log(`✅ ${endpoint} - OK (${res.data.rows?.length || 0} rows)`);
            } else {
                console.error(`❌ ${endpoint} - FAILED (${res.status})`, JSON.stringify(res.data));
            }
        } catch (e: any) {
            console.error(`❌ ${endpoint} - ERROR:`, e.message);
            if (e.response) {
                console.error('   Status:', e.response.status);
                console.error('   Data:', JSON.stringify(e.response.data));
            }
        }
    }
}

runTests();

