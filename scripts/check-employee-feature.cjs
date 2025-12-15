const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

const TENANT_ID = 'f1f5c217-7b39-4031-9d76-b7da090bad65';

async function checkFeatureAccess() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Get tenant DB name
        const res = await client.query('SELECT * FROM tenants WHERE id = $1', [TENANT_ID]);
        const tenant = res.rows[0];
        await client.end();

        // Connect to tenant DB
        const tenantClient = new Client({
            connectionString: tenant.connection_string,
            ssl: { rejectUnauthorized: false }
        });

        await tenantClient.connect();

        console.log('Checking feature_access table...');
        const featureRes = await tenantClient.query(`
      SELECT * FROM feature_access WHERE feature_key = 'employees'
    `);

        if (featureRes.rows.length === 0) {
            console.log('Feature "employees" NOT FOUND in feature_access table.');
        } else {
            console.log('Feature "employees" found:', featureRes.rows[0]);
        }

        await tenantClient.end();

    } catch (err) {
        console.error('Error:', err);
        if (client) await client.end();
    }
}

checkFeatureAccess();
