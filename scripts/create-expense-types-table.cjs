const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.local.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const tenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
    let tenantDbName;
    try {
        const res = await mainPool.query('SELECT db_name FROM tenants WHERE id = $1', [tenantId]);
        if (res.rows.length === 0) {
            console.error('Tenant not found');
            process.exit(1);
        }
        tenantDbName = res.rows[0].db_name;
    } finally {
        await mainPool.end();
    }

    console.log(`Connecting to tenant DB: ${tenantDbName}`);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace(/\/[^/]+$/, `/${tenantDbName}`) });

    try {
        console.log('Creating expense_types table...');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_type_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('expense_types table created/verified.');

        console.log('Checking expenses table columns...');
        const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'expenses'
    `);
        const colNames = cols.rows.map(r => r.column_name);
        console.log('Current columns:', colNames);

        if (!colNames.includes('expense_type_id')) {
            console.log('Adding expense_type_id column...');
            await pool.query(`ALTER TABLE expenses ADD COLUMN expense_type_id UUID REFERENCES expense_types(id)`);
            console.log('Column added.');
        } else {
            console.log('expense_type_id column already exists.');
        }

    } catch (err) {
        console.error('FULL ERROR:', err);
    } finally {
        await pool.end();
    }
}

main();
