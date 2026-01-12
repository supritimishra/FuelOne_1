require('dotenv').config({ path: '.local.env' });
const { Pool } = require('pg');

async function migrate() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log('Adding employee_id to vendor_transactions...');
        await pool.query(`
            ALTER TABLE vendor_transactions 
            ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES employees(id)
        `);
        console.log('✅ Column added successfully');
    } catch (err) {
        console.error('❌ Error adding column:', err);
    } finally {
        await pool.end();
    }
}

migrate();
