
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

        // Check RLS
        const rlsRes = await client.query(`
            SELECT relname, relrowsecurity, relforcerowsecurity
            FROM pg_class
            WHERE oid = 'organization_details'::regclass;
        `);
        console.log('RLS:', rlsRes.rows[0]);

        // Check Triggers
        const triggersRes = await client.query(`
            SELECT tgname, tgtype, tgenabled, pg_get_triggerdef(oid)
            FROM pg_trigger
            WHERE tgrelid = 'organization_details'::regclass;
        `);
        console.log('Triggers:');
        triggersRes.rows.forEach(r => {
            console.log(`- ${r.tgname}: ${r.pg_get_triggerdef}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
