const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

async function checkAll() {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Get all mappings
    const res = await client.query(`
        SELECT tu.user_email, tu.tenant_id, t.connection_string, t.organization_name 
        FROM tenant_users tu 
        JOIN tenants t ON t.id = tu.tenant_id
    `);

    const byTenant = {};
    res.rows.forEach(r => {
        if (!byTenant[r.tenant_id]) {
            byTenant[r.tenant_id] = { conn: r.connection_string, name: r.organization_name, emails: [] };
        }
        byTenant[r.tenant_id].emails.push(r.user_email);
    });

    console.log(`Checking ${Object.keys(byTenant).length} tenants...`);

    for (const tid in byTenant) {
        const { conn, name, emails } = byTenant[tid];
        console.log(`Tenant: ${name} (${emails.length} users)`);

        const tClient = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
        try {
            await tClient.connect();
            for (const email of emails) {
                const uRes = await tClient.query(`SELECT id FROM users WHERE email = $1`, [email]);
                if (uRes.rows.length === 0) {
                    console.log(`  MISSING: ${email}`);
                }
            }
        } catch (e) {
            console.log(`  Error connecting: ${e.message}`);
        } finally {
            await tClient.end();
        }
    }
    await client.end();
}
checkAll();
