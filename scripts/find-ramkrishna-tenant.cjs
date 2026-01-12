
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
            SELECT tenant_db_name, organization_name 
            FROM tenants 
            WHERE organization_name ILIKE '%Ramkrishna%'
        `);

        if (res.rows.length === 0) {
            console.log('No tenant found matching "Ramkrishna".');
        } else {
            console.log('Found tenants:');
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
