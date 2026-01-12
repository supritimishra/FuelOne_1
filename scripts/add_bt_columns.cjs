require('dotenv').config({ path: '.local.env' });
const { Pool } = require('pg');

async function migrate() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log('Adding columns to business_transactions...');
        await pool.query(`
            ALTER TABLE business_transactions 
            ADD COLUMN IF NOT EXISTS effected_party text,
            ADD COLUMN IF NOT EXISTS source text,
            ADD COLUMN IF NOT EXISTS entered_by text
        `);
        console.log('✅ Columns added successfully');
    } catch (err) {
        console.error('❌ Error adding columns:', err);
    } finally {
        await pool.end();
    }
}

migrate();
