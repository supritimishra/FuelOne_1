require('dotenv').config({ path: '.local.env' });
const { Pool } = require('pg');

async function resetMasters() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        await pool.query('BEGIN');

        console.log('Resetting vendors...');
        await pool.query('TRUNCATE vendors RESTART IDENTITY CASCADE');
        await pool.query("INSERT INTO vendors (vendor_name, is_active) VALUES ('Vendor 1', true), ('Vendor 2', true)");

        console.log('Resetting employees...');
        await pool.query('TRUNCATE employees RESTART IDENTITY CASCADE');
        await pool.query("INSERT INTO employees (employee_name, designation, is_active) VALUES ('Employee 1', 'Staff', true), ('Employee 2', 'Staff', true)");

        await pool.query('COMMIT');
        console.log('✅ Vendors and Employees reset successfully');
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('❌ Error in reset:', err);
    } finally {
        await pool.end();
    }
}

resetMasters();
