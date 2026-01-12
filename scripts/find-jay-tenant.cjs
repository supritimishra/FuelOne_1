
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

async function findTenant() {
    const client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT t.tenant_db_name, t.organization_name, tu.user_email 
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE tu.user_email = 'jay@gmail.com'
        `);

        if (res.rows.length === 0) {
            console.log('User jay@gmail.com not found in any tenant.');
        } else {
            console.log('User jay@gmail.com belongs to tenants:');
            res.rows.forEach(r => {
                console.log(`- ${r.organization_name} (DB: ${r.tenant_db_name})`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

findTenant();
