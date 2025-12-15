
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

async function check() {
    // Target Jay's DB
    const tenantDbName = 'petropal_tenant_d9a422c63387';
    const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
    const client = new Client({ connectionString: tenantUrl });
    await client.connect();

    try {
        console.log(`Checking DB: ${tenantDbName}`);

        const res = await client.query(`
            SELECT column_name, is_nullable, data_type
            FROM information_schema.columns 
            WHERE table_name = 'business_transactions'
            AND column_name = 'created_by';
        `);

        console.log('created_by column:', res.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
