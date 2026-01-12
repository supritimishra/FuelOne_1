
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
    const client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT t.tenant_db_name, t.organization_name 
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE tu.user_email = 'jay@gmail.com'
        `);

        console.log('Jay\'s Tenants:');
        res.rows.forEach(r => {
            console.log(`- DB: ${r.tenant_db_name} (Org: ${r.organization_name})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
