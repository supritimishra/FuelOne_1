
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

async function run() {
    // Target Jay's DB
    const tenantDbName = 'petropal_tenant_d9a422c63387';
    const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
    const client = new Client({ connectionString: tenantUrl });
    await client.connect();

    try {
        console.log(`Targeting DB: ${tenantDbName}`);

        console.log('Adding description column...');
        await client.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description text;`);

        console.log('Adding is_active column...');
        await client.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`);

        console.log('Done. Verifying...');

        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'vendors'
            AND column_name IN ('description', 'is_active');
        `);
        console.log('Found columns:', res.rows.map(r => r.column_name));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
