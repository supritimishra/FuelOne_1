
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
        // Get Jay's tenants
        const res = await client.query(`
            SELECT t.tenant_db_name, t.organization_name 
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE tu.user_email = 'jay@gmail.com'
        `);

        for (const row of res.rows) {
            const tenantDbName = row.tenant_db_name;
            console.log(`Checking tenant DB: ${tenantDbName} (${row.organization_name})`);

            try {
                const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
                const tenantClient = new Client({ connectionString: tenantUrl });
                await tenantClient.connect();

                const orgRes = await tenantClient.query(`SELECT organization_name FROM organization_details`);
                if (orgRes.rows.length > 0) {
                    console.log(`  Found organization_details name: "${orgRes.rows[0].organization_name}"`);
                } else {
                    console.log(`  No organization_details record found.`);
                }

                await tenantClient.end();
            } catch (err) {
                console.log(`  [ERROR] ${err.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
