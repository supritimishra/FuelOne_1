
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
        // 1. Get the first tenant DB
        const res = await client.query(`SELECT tenant_db_name FROM tenants LIMIT 1`);
        if (res.rows.length === 0) {
            console.log('No tenants found.');
            return;
        }
        const tenantDbName = res.rows[0].tenant_db_name;
        console.log(`Checking tenant DB: ${tenantDbName}`);

        // 2. Connect to tenant DB
        const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
        const tenantClient = new Client({ connectionString: tenantUrl });
        await tenantClient.connect();

        // 3. Check constraints
        const constraintsRes = await tenantClient.query(`
            SELECT conname, contype, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'organization_details'::regclass;
        `);

        console.log('Constraints:');
        constraintsRes.rows.forEach(r => {
            console.log(`  ${r.conname} (${r.contype}): ${r.pg_get_constraintdef}`);
        });

        await tenantClient.end();
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
