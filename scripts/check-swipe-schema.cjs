const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.local.env') });

async function checkSchema() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Get all tenants
        const tenantsRes = await client.query("SELECT id, name, schema_name FROM tenants");

        for (const tenant of tenantsRes.rows) {
            console.log(`\nChecking Tenant: ${tenant.name} (${tenant.schema_name})`);
            try {
                // Set search path
                await client.query(`SET search_path TO "${tenant.schema_name}"`);

                // Get columns
                const res = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = '${tenant.schema_name}' 
          AND table_name = 'swipe_transactions'
        `);

                if (res.rows.length === 0) {
                    console.log('  Table swipe_transactions does not exist');
                    continue;
                }

                console.log('  Columns in swipe_transactions:');
                res.rows.forEach(r => console.log(`    - ${r.column_name} (${r.data_type})`));

            } catch (err) {
                console.log(`  Error checking tenant ${tenant.name}:`, err.message);
            }
        }

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
