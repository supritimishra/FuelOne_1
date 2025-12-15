const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.local.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
}

const tenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';

async function main() {
    const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
    let tenantDbName;
    try {
        const res = await mainPool.query('SELECT db_name FROM tenants WHERE id = $1', [tenantId]);
        tenantDbName = res.rows[0].db_name;
    } finally {
        await mainPool.end();
    }

    console.log(`Connecting to tenant DB: ${tenantDbName}`);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace(/\/[^/]+$/, `/${tenantDbName}`) });

    try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
        console.log('pgcrypto extension enabled.');

        const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('expenses', 'expense_types')
    `);
        console.log('Existing tables:', tables.rows.map(r => r.table_name));

        if (tables.rows.find(r => r.table_name === 'expenses')) {
            const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses'`);
            console.log('Expenses columns:', cols.rows.map(r => r.column_name));
        }

        // Try creating expense_types
        await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_type_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('expense_types table checked/created.');

        // Add column if missing
        const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses'`);
        if (!cols.rows.map(r => r.column_name).includes('expense_type_id')) {
            console.log('Adding expense_type_id...');
            await pool.query(`ALTER TABLE expenses ADD COLUMN expense_type_id UUID REFERENCES expense_types(id)`);
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await pool.end();
    }
}

main();
