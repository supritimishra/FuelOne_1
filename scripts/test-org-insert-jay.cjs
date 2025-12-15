
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.local.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim().replace(/"/g, '');
});

async function testInsert() {
    // Target DB from previous step
    const tenantDbName = 'petropal_tenant_d9a422c63387';
    console.log(`Testing on tenant DB: ${tenantDbName}`);

    const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
    const tenantClient = new Client({ connectionString: tenantUrl });
    await tenantClient.connect();

    try {
        // Try INSERT with empty values
        const sql = `
            INSERT INTO organization_details 
            (organization_name, phone_number, email, address, bank_name, gst_number, logo_url, 
             owner_name, mobile_number, pan_number, account_number, ifsc_code, branch_name, upi_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
            RETURNING *
        `;
        const params = [
            '', // organization_name
            null, null, null, null, null, null, null, null, null, null, null, null, null
        ];

        try {
            console.log('Attempting INSERT...');
            await tenantClient.query(sql, params);
            console.log('INSERT successful');
        } catch (err) {
            console.error('INSERT failed:', err.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await tenantClient.end();
    }
}

testInsert();
