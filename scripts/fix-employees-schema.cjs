const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

const TENANT_ID = 'f1f5c217-7b39-4031-9d76-b7da090bad65';

async function fixSchema() {
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

        console.log('Adding missing columns to employees table...');
        await tenantClient.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS salary_type TEXT,
      ADD COLUMN IF NOT EXISTS salary NUMERIC,
      ADD COLUMN IF NOT EXISTS has_pf BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS has_esi BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS has_income_tax BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS employee_number TEXT,
      ADD COLUMN IF NOT EXISTS id_proof_no TEXT,
      ADD COLUMN IF NOT EXISTS join_date DATE,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);

        console.log('✅ Columns added successfully');

        await tenantClient.end();

    } catch (err) {
        console.error('Error:', err);
        if (client) await client.end();
    }
}

fixSchema();
