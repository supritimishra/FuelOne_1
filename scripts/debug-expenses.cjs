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
    try {
        const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
        let tenantDbName;
        try {
            const res = await mainPool.query('SELECT tenant_db_name FROM tenants WHERE id = $1', [tenantId]);
            if (res.rows.length === 0) {
                throw new Error('Tenant not found');
            }
            tenantDbName = res.rows[0].tenant_db_name;
        } finally {
            await mainPool.end();
        }

        console.log(`Connecting to tenant DB: ${tenantDbName}`);
        const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace(/\/[^/]+$/, `/${tenantDbName}`) });

        try {
            // Check tables
            const tables = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('expenses', 'expense_types')
      `);
            console.log('Existing tables:', tables.rows.map(r => r.table_name));

            // Check expense_types columns
            if (tables.rows.find(r => r.table_name === 'expense_types')) {
                const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'expense_types'`);
                console.log('ExpenseTypes columns:', cols.rows.map(r => r.column_name));
            } else {
                console.log('Creating expense_types...');
                await pool.query(`
          CREATE TABLE expense_types (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            expense_type_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
                console.log('expense_types created.');
            }

            // Check expenses columns
            if (tables.rows.find(r => r.table_name === 'expenses')) {
                const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses'`);
                const colNames = cols.rows.map(r => r.column_name);
                console.log('Expenses columns:', colNames);

                if (!colNames.includes('expense_type_id')) {
                    console.log('Adding expense_type_id...');
                    await pool.query(`ALTER TABLE expenses ADD COLUMN expense_type_id UUID REFERENCES expense_types(id)`);
                    console.log('Column added.');
                }
            }

        } catch (e) {
            const msg = `MESSAGE: ${e.message}\nSTACK: ${e.stack}\nDETAIL: ${JSON.stringify(e)}`;
            fs.writeFileSync('error.log', msg);
            console.error('Error written to error.log');
        } finally {
            await pool.end();
        }
    } catch (err) {
        const msg = `GLOBAL MESSAGE: ${err.message}\nSTACK: ${err.stack}`;
        fs.writeFileSync('error.log', msg);
        console.error('Global error written to error.log');
    }
}

main();
