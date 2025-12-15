const { Client } = require('pg');

const TENANT_DB_URL = "postgresql://postgres.rozgwrsgenmsixvrdvxu:%40Tkhg9966@aws-1-ap-south-1.pooler.supabase.com:6543/tenant_c5ffa071_3e29_4dc8_8183_bd0405c54269";

async function checkSchema() {
    const client = new Client({ connectionString: TENANT_DB_URL });
    try {
        await client.connect();
        console.log('Connected to tenant DB');

        // Check table existence
        const tableRes = await client.query(`
      SELECT to_regclass('public.expense_types') as table_exists;
    `);
        console.log('Table exists:', tableRes.rows[0].table_exists);

        if (tableRes.rows[0].table_exists) {
            // Check columns
            const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'expense_types';
      `);
            console.log('Columns:', colsRes.rows);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
