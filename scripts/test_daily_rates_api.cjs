const http = require('http');

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : {};
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function run() {
    console.log("-> Starting API Verification for Daily Rates...");
    const PORT = 5005;
    const HOST = 'localhost';

    try {
        // 0. Probe Auth
        console.log("0. Probing Auth...");
        const probeRes = await request({
            host: HOST, port: PORT, path: '/api/auth/test', method: 'GET'
        });
        console.log(`   Probe status: ${probeRes.statusCode}`);
        if (probeRes.statusCode !== 200) {
            console.error("   Probe Body:", typeof probeRes.body === 'string' ? probeRes.body.slice(0, 500) : JSON.stringify(probeRes.body));
        }

        // 1. Reset Dev Account
        console.log("1. Resetting Dev Account...");
        const resetRes = await request({
            host: HOST, port: PORT, path: '/api/auth/dev-reset', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (resetRes.statusCode !== 200) {
            console.error("Reset Headers:", resetRes.headers);
            console.error("Reset Body Raw:", typeof resetRes.body === 'string' ? resetRes.body.slice(0, 500) : JSON.stringify(resetRes.body));
            throw new Error(`Reset failed (Status ${resetRes.statusCode})`);
        }
        if (!resetRes.body.ok) throw new Error("Reset OK=false: " + JSON.stringify(resetRes.body));

        const { email, password } = resetRes.body;
        console.log(`   Dev credentials: ${email} / ${password}`);

        // 2. Login
        console.log("2. Logging in...");
        const loginRes = await request({
            host: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email, password });

        if (loginRes.statusCode !== 200) throw new Error("Login failed: " + JSON.stringify(loginRes.body));

        // Extract Cookie
        const cookies = loginRes.headers['set-cookie'];
        if (!cookies) throw new Error("No cookies received");
        const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
        console.log("   Logged in. Cookie captured.");

        // 3. Get Fuel Products
        console.log("3. Fetching Fuel Products...");
        const productsRes = await request({
            host: HOST, port: PORT, path: '/api/fuel-products', method: 'GET',
            headers: { 'Cookie': cookieHeader }
        });
        if (!productsRes.body.ok) throw new Error("Fetch products failed: " + JSON.stringify(productsRes.body));
        const products = productsRes.body.data;
        console.log(`   Found ${products.length} products: ${products.map(p => p.shortName).join(', ')}`);

        if (products.length === 0) throw new Error("No fuel products found to test with");

        // 4. Save Daily Rates
        // Use a random date in 2025 to avoid collisions
        const randomDay = Math.floor(Math.random() * 28) + 1;
        const randomMonth = Math.floor(Math.random() * 12) + 1;
        const TEST_DATE = `2025-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`;
        console.log(`   Using Test Date: ${TEST_DATE}`);
        const rates = products.map(p => ({
            fuelProductId: p.id,
            openRate: "90.50",
            closeRate: "91.00"
        }));

        const payload = {
            date: TEST_DATE,
            shift: 'S-1', // Added Shift
            rates: rates
        };
        console.log(`4. Saving rates for ${TEST_DATE} (Shift S-1)...`);

        const saveRes = await request({
            host: HOST, port: PORT, path: '/api/daily-rates', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader }
        }, payload);

        const saveJson = saveRes.body; // Assuming request function already parses JSON
        console.log("   Save Status:", saveJson.ok);
        if (!saveJson.ok) {
            console.error("!!! SAVE ERROR !!! :", saveJson.error);
            throw new Error("Save Failed");
        }


        console.log("4a. Testing Duplicate Prevention...");
        const dupRes = await request({
            host: HOST, port: PORT, path: '/api/daily-rates', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader }
        }, payload);
        const dupJson = dupRes.body; // Assuming request function already parses JSON
        console.log("   Duplicate Response (Expected Fail):", JSON.stringify(dupJson));
        if (dupJson.ok) throw new Error("Duplicate check FAILED! Should have rejected.");
        if (!dupJson.error.includes("already exists")) throw new Error("Duplicate error message mismatch.");


        // 5. Verify Persistence
        console.log("5. Verifying Persistence...");
        // Add shift to query
        const getRes = await request({
            host: HOST, port: PORT, path: `/api/daily-rates?date=${TEST_DATE}&shift=S-1`, method: 'GET',
            headers: { 'Cookie': cookieHeader }
        });
        const getJson = getRes.body; // Assuming request function already parses JSON

        if (!getJson.ok) throw new Error("Fetch Failed: " + JSON.stringify(getJson));

        console.log(`   Retrieved ${getJson.data?.length} rate entries.`);
        if (getJson.data?.length !== products.length) throw new Error("Entry count mismatch");

        // Check values
        const match = getJson.data.find(r => r.fuelProductId === products[0].id);
        if (!match) throw new Error("Saved rate not found for first product");
        if (parseFloat(match.openRate) !== 90.50 || parseFloat(match.closeRate) !== 91.00) {
            throw new Error(`   Mismatch! Expected 90.50/91.00, got ${match.openRate}/${match.closeRate}`);
        }
        console.log("   Data verification PASSED.");

        console.log("-> ALL TESTS PASSED");

    } catch (err) {
        console.error("-> TEST FAILED:", err.message);
        process.exit(1);
    }
}

run();
