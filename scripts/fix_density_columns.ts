import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { listActiveTenants } from '../server/services/tenant-provisioning.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

async function fixTenantColumns(tenantId: string, connectionString: string, tenantName: string) {
    let pool: Pool | null = null;
    try {
        console.log(`\n📦 Checking tenant: ${tenantName} (${tenantId})`);
        pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
        });

        const queries = [
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS invoice_no TEXT`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS before_dip NUMERIC(12,3)`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS before_stock NUMERIC(12,3)`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS after_dip NUMERIC(12,3)`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS after_stock NUMERIC(12,3)`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS stock_dumped NUMERIC(12,3)`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS stock_difference NUMERIC(12,3)`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS density NUMERIC(12,3)`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS temp NUMERIC(12,3)`,
            `ALTER TABLE tank_daily_readings ADD COLUMN IF NOT EXISTS hydrometer NUMERIC(12,3)`
        ];

        for (const q of queries) {
            await pool.query(q);
        }
        console.log(`✅ Columns fixed for tenant: ${tenantName}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to fix tenant ${tenantName}:`, error);
        return false;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

async function main() {
    try {
        console.log('🚀 Starting column fix for all tenant databases...\n');
        const tenants = await listActiveTenants();

        if (tenants.length === 0) {
            console.log('ℹ️ No active tenants found');
            return;
        }

        console.log(`Found ${tenants.length} active tenant(s)\n`);

        for (const tenant of tenants) {
            await fixTenantColumns(
                tenant.id,
                tenant.connectionString,
                tenant.organizationName
            );
        }

        console.log('\n✅ All tenants processed');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
