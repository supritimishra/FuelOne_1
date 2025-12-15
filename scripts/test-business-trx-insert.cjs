
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
    // Target Jay's DB
    const tenantDbName = 'petropal_tenant_d9a422c63387';
    const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
    const client = new Client({ connectionString: tenantUrl });
    await client.connect();

    try {
        console.log(`Testing on tenant DB: ${tenantDbName}`);

        const sql = `
            INSERT INTO business_transactions (transaction_date, transaction_type, party_name, amount, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;

        // Values from screenshot
        const params = [
            new Date().toISOString().split('T')[0], // transaction_date (Today)
            'Debit', // transaction_type
            'Cash', // party_name
            1000, // amount
            'Test amount transaction' // description
        ];

        try {
            console.log('Attempting INSERT...');
            const res = await client.query(sql, params);
            console.log('INSERT successful, ID:', res.rows[0].id);
        } catch (err) {
            console.error('INSERT failed:', err.message);
            console.error('Full error:', err);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

testInsert();
