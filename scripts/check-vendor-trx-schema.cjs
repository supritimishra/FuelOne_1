const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

const TENANT_ID = 'f1f5c217-7b39-4031-9d76-b7da090bad65';

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Get tenant DB name
        const res = await client.query('SELECT * FROM tenants WHERE id = $1', [TENANT_ID]);
        if (res.rows.length === 0) {
            console.error('Tenant not found');
            return;
        }

        const tenant = res.rows[0];
        await client.end();

        // Connect to tenant DB
        const tenantClient = new Client({
            connectionString: tenant.connection_string,
            ssl: { rejectUnauthorized: false }
        });

        await tenantClient.connect();

        const tableRes = await tenantClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_transactions'
    `);

        console.log('Columns in vendor_transactions:');
        tableRes.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

        const hasEmployee = tableRes.rows.some(r => r.column_name === 'employee_id');
        console.log(`\nHas employee_id: ${hasEmployee}`);

        await tenantClient.end();

    } catch (err) {
        console.error('Error:', err);
        if (client) await client.end();
    }
}

checkSchema();
