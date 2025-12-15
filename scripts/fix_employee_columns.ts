
import { pool } from '../server/db.js';
import pg from 'pg';

async function main() {
    console.log('🔧 Fixing employees table columns...');

    const tenantRes = await pool.query(`SELECT id, organization_name, connection_string FROM tenants WHERE status = 'active'`);

    for (const tenant of tenantRes.rows) {
        console.log(`Processing tenant: ${tenant.organization_name} (${tenant.id})`);
        const tenantPool = new pg.Pool({
            connectionString: tenant.connection_string,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await tenantPool.query(`
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS salary_type text,
            ADD COLUMN IF NOT EXISTS phone_no text,
            ADD COLUMN IF NOT EXISTS employee_number text,
            ADD COLUMN IF NOT EXISTS id_proof_no text,
            ADD COLUMN IF NOT EXISTS join_date date,
            ADD COLUMN IF NOT EXISTS has_pf boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS has_esi boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS has_income_tax boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS mobile_number text,
            ADD COLUMN IF NOT EXISTS designation text,
            ADD COLUMN IF NOT EXISTS address text,
            ADD COLUMN IF NOT EXISTS description text,
            ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
            ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()
        `);
            console.log(`  ✅ Schema updated.`);
        } catch (e) {
            console.error(`  ❌ Failed: ${(e as Error).message}`);
        } finally {
            await tenantPool.end();
        }
    }
    await pool.end();
}

main().catch(console.error);
