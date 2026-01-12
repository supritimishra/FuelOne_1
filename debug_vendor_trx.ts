import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5002/api';

async function testVendorTransactions() {
    console.log("🔍 Testing GET /vendor-transactions...");
    try {
        const res = await fetch(`${BASE_URL}/vendor-transactions`);
        console.log(`Status: ${res.status} ${res.statusText}`);

        try {
            const data = await res.json();
            console.log("Response Body:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("Could not parse JSON body:", await res.text());
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testVendorTransactions();
