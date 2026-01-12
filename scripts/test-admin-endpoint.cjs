const http = require('http');
const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

const jwt = require('jsonwebtoken');

async function test() {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query(`SELECT t.id as tenant_id FROM tenant_users tu JOIN tenants t ON t.id = tu.tenant_id WHERE tu.user_email = 'jay@gmail.com'`);
    await client.end();

    if (res.rows.length === 0) { console.log('No tenant mapping'); return; }
    const tenantId = res.rows[0].tenant_id;
    const userId = '235e168e-274a-45bd-9322-e81643263a81'; // Jay's ID

    // Generate token
    const token = jwt.sign({ userId: 'admin-id', email: 'admin@example.com', tenantId: 'admin-tenant' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log(`Testing admin endpoint for tenant ${tenantId}, user ${userId}`);

    const options = {
        hostname: 'localhost',
        port: 5001,
        path: `/api/admin/users/${userId}/features?tenantId=${tenantId}`,
        method: 'GET',
        headers: {
            'X-Tenant-Id': tenantId,
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log('HEADERS:', JSON.stringify(res.headers));
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('Response OK:', json.ok);
                if (json.fallback) console.log('Fallback:', json.fallback);
                if (json.error) console.log('Error:', json.error);
                if (json.features) {
                    console.log('Feature count:', Object.keys(json.features).length);
                    console.log('Has lubricants key:', Object.keys(json.features).includes('lubricants'));
                    console.log('lubricants value:', json.features['lubricants']);
                }
                // console.log('RAW:', data); // Uncomment if needed, but it's huge
            } catch (e) {
                console.log('Response not JSON:', data.substring(0, 100));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.end();
}
test();
