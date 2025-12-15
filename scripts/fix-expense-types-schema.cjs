const { Client } = require('pg');

const connectionString = "postgresql://postgres.rozgwrsgenmsixvrdvxu:%40Tkhg9966@aws-1-ap-south-1.pooler.supabase.com:6543/tenant_c5ffa071_3e29_4dc8_8183_bd0405c54269";

const config = {
    connectionString,
    ssl: { rejectUnauthorized: false }
};

async function fixSchema() {
    const client = new Client(config);
    try {
        console.log('Connecting to tenant DB...');
        await client.connect();
        console.log('Connected.');

        // Check columns first
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'expense_types';
    `);
        const columns = res.rows.map(r => r.column_name);
        console.log('Current columns:', columns);

        if (!columns.includes('effect_for')) {
            console.log('Adding effect_for column...');
            await client.query(`ALTER TABLE expense_types ADD COLUMN effect_for VARCHAR(50) DEFAULT 'Employee';`);
            console.log('Added effect_for.');
        } else {
            console.log('effect_for column already exists.');
        }

        if (!columns.includes('options')) {
            console.log('Adding options column...');
            await client.query(`ALTER TABLE expense_types ADD COLUMN options JSONB DEFAULT '[]';`);
            console.log('Added options.');
        } else {
            console.log('options column already exists.');
        }

        if (!columns.includes('is_active')) {
            console.log('Adding is_active column...');
            await client.query(`ALTER TABLE expense_types ADD COLUMN is_active BOOLEAN DEFAULT true;`);
            console.log('Added is_active.');
        }

    } catch (err) {
        console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } finally {
        await client.end();
    }
}

fixSchema();
