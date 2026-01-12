const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

async function verify() {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query(`SELECT t.connection_string FROM tenant_users tu JOIN tenants t ON t.id = tu.tenant_id WHERE tu.user_email = 'jay@gmail.com'`);
    await client.end();

    if (res.rows.length === 0) { console.log('No tenant mapping'); return; }

    const tClient = new Client({ connectionString: res.rows[0].connection_string, ssl: { rejectUnauthorized: false } });
    await tClient.connect();
    const uRes = await tClient.query(`SELECT id, email FROM users WHERE email = 'jay@gmail.com'`);
    await tClient.end();

    if (uRes.rows.length > 0) {
        console.log('SUCCESS: User found in tenant DB. ID:', uRes.rows[0].id);
    } else {
        console.log('FAILURE: User NOT found in tenant DB');
    }
}
verify();
