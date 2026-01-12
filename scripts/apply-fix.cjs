const { Pool } = require('pg');

// Connection string for the specific tenant
// Using the host from .local.env but targeting the tenant DB
const connectionString = "postgresql://postgres.rozgwrsgenmsixvrdvxu:%40Tkhg9966@aws-1-ap-south-1.pooler.supabase.com:6543/tenant_c5ffa071_3e29_4dc8_8183_bd0405c54269";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000, // Increased timeout
    idleTimeoutMillis: 30000
});

async function run() {
    let client;
    try {
        console.log('Connecting...');
        client = await pool.connect();
        console.log('Connected.');

        console.log('Adding effect_for...');
        await client.query("ALTER TABLE expense_types ADD COLUMN IF NOT EXISTS effect_for VARCHAR(50) DEFAULT 'Employee'");
        console.log('Done.');

        console.log('Adding options...');
        await client.query("ALTER TABLE expense_types ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'");
        console.log('Done.');

        console.log('Adding is_active...');
        await client.query("ALTER TABLE expense_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true");
        console.log('Done.');

        console.log('SUCCESS: Schema updated.');
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

run();
