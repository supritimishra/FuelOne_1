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
        console.log('Connected to master DB');

        // Get tenant DB name
        const res = await client.query('SELECT * FROM tenants WHERE id = $1', [TENANT_ID]);
        if (res.rows.length === 0) {
            console.error('Tenant not found');
            return;
        }

        const tenant = res.rows[0];
        console.log(`Found tenant: ${tenant.organization_name} (${tenant.tenant_db_name})`);
        console.log(`Connection string: ${tenant.connection_string}`);

        await client.end();

        // Connect to tenant DB
        const tenantClient = new Client({
            connectionString: tenant.connection_string,
            ssl: { rejectUnauthorized: false }
        });

        await tenantClient.connect();
        console.log('Connected to tenant DB');

        const tableRes = await tenantClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'credit_customers'
    `);

        console.log('Columns in credit_customers:');
        tableRes.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

        const hasCol = tableRes.rows.some(r => r.column_name === 'representative_name');
        console.log(`\nHas representative_name: ${hasCol}`);

        await tenantClient.end();

    } catch (err) {
        console.error('Error:', err);
        if (client) await client.end();
    }
}

checkSchema();
