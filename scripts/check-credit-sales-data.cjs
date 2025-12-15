const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

const TENANT_ID = 'f1f5c217-7b39-4031-9d76-b7da090bad65';

async function checkData() {
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

        console.log('Checking credit_sales table...');
        const countRes = await tenantClient.query('SELECT COUNT(*) FROM credit_sales');
        console.log(`Total rows: ${countRes.rows[0].count}`);

        const rowsRes = await tenantClient.query(`
      SELECT cs.id, cs.sale_date, cs.total_amount, cc.organization_name 
      FROM credit_sales cs
      LEFT JOIN credit_customers cc ON cs.credit_customer_id = cc.id
      ORDER BY cs.created_at DESC 
      LIMIT 5
    `);

        console.log('Recent rows:');
        rowsRes.rows.forEach(row => {
            console.log(JSON.stringify(row));
        });

        await tenantClient.end();

    } catch (err) {
        console.error('Error:', err);
        if (client) await client.end();
    }
}

checkData();
