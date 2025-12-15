
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

async function listTenants() {
    const client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query(`SELECT tenant_db_name, organization_name FROM tenants`);
        console.log('Tenants:');
        res.rows.forEach(r => {
            console.log(`- ${r.organization_name} (DB: ${r.tenant_db_name})`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

listTenants();
