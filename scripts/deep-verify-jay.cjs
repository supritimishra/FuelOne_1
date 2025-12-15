const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

async function verify() {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query(`SELECT t.connection_string, t.id as tenant_id FROM tenant_users tu JOIN tenants t ON t.id = tu.tenant_id WHERE tu.user_email = 'jay@gmail.com'`);
    await client.end();

    if (res.rows.length === 0) { console.log('No tenant mapping'); return; }

    const { connection_string, tenant_id } = res.rows[0];
    console.log(`Tenant ID: ${tenant_id}`);

    const tClient = new Client({ connectionString: connection_string, ssl: { rejectUnauthorized: false } });
    await tClient.connect();

    const uRes = await tClient.query(`SELECT id, email FROM users WHERE email = 'jay@gmail.com'`);
    if (uRes.rows.length === 0) { console.log('User not found in tenant DB'); await tClient.end(); return; }

    const userId = uRes.rows[0].id;
    console.log(`User ID: ${userId}`);

    // Check feature_permissions for duplicates/casing
    const fpRes = await tClient.query(`SELECT id, feature_key FROM feature_permissions WHERE LOWER(feature_key) = 'lubricants'`);
    console.log(`feature_permissions matches:`);
    fpRes.rows.forEach(r => console.log(`  - ${r.feature_key} (ID: ${r.id})`));

    // Check user_feature_access
    const ufaRes = await tClient.query(`
        SELECT ufa.allowed, fp.feature_key 
        FROM user_feature_access ufa
        JOIN feature_permissions fp ON fp.id = ufa.feature_id
        WHERE ufa.user_id = $1 AND LOWER(fp.feature_key) = 'lubricants'
    `, [userId]);
    console.log(`user_feature_access matches:`);
    ufaRes.rows.forEach(r => console.log(`  - ${r.feature_key}: ${r.allowed}`));

    // Check feature_access
    const faRes = await tClient.query(`SELECT feature_key, allowed FROM feature_access WHERE user_id = $1 AND LOWER(feature_key) = 'lubricants'`, [userId]);
    console.log(`feature_access matches:`);
    faRes.rows.forEach(r => console.log(`  - ${r.feature_key}: ${r.allowed}`));

    await tClient.end();
}
verify();
