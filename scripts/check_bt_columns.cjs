require('dotenv').config({ path: '.local.env' });
const { Pool } = require('pg');

async function checkColumns() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'business_transactions'
            ORDER BY ordinal_position
        `);
        const cols = res.rows.map(row => `${row.column_name} (${row.data_type})`).join(', ');
        console.log('COLUMNS: ' + cols);
    } finally {
        await pool.end();
    }
}

checkColumns();
