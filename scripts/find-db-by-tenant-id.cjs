
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
        const tenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
        console.log(`Looking up DB for tenant ID: ${tenantId}`);

        const res = await client.query(`
            SELECT id, tenant_db_name, organization_name 
            FROM tenants 
            WHERE id = $1
        `, [tenantId]);

        if (res.rows.length > 0) {
            console.log('Found Tenant:');
            console.log(`- DB Name: ${res.rows[0].tenant_db_name}`);
            console.log(`- Org Name: ${res.rows[0].organization_name}`);
        } else {
            console.log('Tenant not found in main DB.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
