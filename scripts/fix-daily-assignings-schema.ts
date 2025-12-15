import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { listActiveTenants } from '../server/services/tenant-provisioning.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

const sql = `
  CREATE TABLE IF NOT EXISTS daily_lub_assignings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assign_date date NOT NULL,
    recovery_date date,
    shift text CHECK (shift IN ('S-1','S-2')),
    employee_id uuid REFERENCES employees(id),
    product text,
    product_rate numeric,
    assigned numeric,
    sold numeric,
    balance numeric,
    collected numeric,
    shortage numeric,
    created_by uuid,
    created_at timestamp DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_lub_assignings_date ON daily_lub_assignings(assign_date);

  CREATE TABLE IF NOT EXISTS daily_nozzle_assignings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assign_date date NOT NULL,
    shift text CHECK (shift IN ('S-1','S-2')),
    employee_id uuid REFERENCES employees(id),
    nozzle text,
    notes text,
    created_by uuid,
    created_at timestamp DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_nozzle_assignings_date ON daily_nozzle_assignings(assign_date);
`;

async function fixAllTenants() {
    try {
        console.log('🚀 Starting schema fix for all tenant databases...\n');

        const tenants = await listActiveTenants();

        if (tenants.length === 0) {
            console.log('ℹ️ No active tenants found');
            return;
        }

        console.log(`Found ${tenants.length} active tenant(s)\n`);

        for (const tenant of tenants) {
            console.log(`\n📦 Fixing tenant: ${tenant.organizationName} (${tenant.id})`);
            const pool = new Pool({
                connectionString: tenant.connectionString,
                ssl: { rejectUnauthorized: false },
            });

            try {
                await pool.query(sql);
                console.log(`✅ Schema applied successfully for tenant: ${tenant.organizationName}`);
            } catch (error) {
                console.error(`❌ Failed to apply schema for tenant ${tenant.organizationName}:`, error);
            } finally {
                await pool.end();
            }
        }

        console.log('\n✅ All tenants processed');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

fixAllTenants();
