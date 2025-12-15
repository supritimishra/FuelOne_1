const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

const TENANT_ID = 'f1f5c217-7b39-4031-9d76-b7da090bad65';

async function applyFix() {
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

        await client.end();

        // Connect to tenant DB
        const tenantClient = new Client({
            connectionString: tenant.connection_string,
            ssl: { rejectUnauthorized: false }
        });

        await tenantClient.connect();
        console.log('Connected to tenant DB');

        console.log('Adding employee_id column...');
        await tenantClient.query(`
      ALTER TABLE vendor_transactions 
      ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);
    `);

        console.log('✅ Column added successfully');

        await tenantClient.end();

    } catch (err) {
        console.error('Error:', err);
        if (client) await client.end();
    }
}

applyFix();
