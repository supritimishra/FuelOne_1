
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
    const client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();

    try {
        // 1. Get the first tenant DB
        const res = await client.query(`SELECT tenant_db_name FROM tenants LIMIT 1`);
        if (res.rows.length === 0) {
            console.log('No tenants found.');
            return;
        }
        const tenantDbName = res.rows[0].tenant_db_name;
        console.log(`Testing on tenant DB: ${tenantDbName}`);

        // 2. Connect to tenant DB
        const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
        const tenantClient = new Client({ connectionString: tenantUrl });
        await tenantClient.connect();

        // 3. Try INSERT
        const sql = `
            INSERT INTO organization_details 
            (organization_name, phone_number, email, address, bank_name, gst_number, logo_url, 
             owner_name, mobile_number, pan_number, account_number, ifsc_code, branch_name, upi_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
            RETURNING *
        `;
        const params = [
            'Test Org Duplicate', '1234567890', 'test@example.com', 'Address', 'Bank', 'GST123', 'http://logo.url',
            'Owner', '9876543210', 'PAN123', 'ACC123', 'IFSC123', 'Branch', 'UPI123'
        ];

        try {
            console.log('Attempting first INSERT...');
            await tenantClient.query(sql, params);
            console.log('First INSERT successful');

            console.log('Attempting second INSERT (duplicate)...');
            await tenantClient.query(sql, params);
            console.log('Second INSERT successful');
        } catch (err) {
            console.error('INSERT failed:', err.message);
        }

        await tenantClient.end();
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

testInsert();
