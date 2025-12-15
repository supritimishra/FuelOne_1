
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

        const pathRes = await client.query('SHOW search_path');
        console.log('search_path:', pathRes.rows[0].search_path);

        try {
            const uuidRes = await client.query('SELECT gen_random_uuid()');
            console.log('gen_random_uuid() works:', uuidRes.rows[0].gen_random_uuid);
        } catch (err) {
            console.error('gen_random_uuid() FAILED:', err.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
