import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

const targetTenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65'; // From the error log

async function verifyTenantTables() {
    // We need to find the connection string for this tenant.
    // Since we don't have direct access to the master DB here easily without importing services,
    // we will try to connect to the master DB first to get the tenant connection string.
    // OR, we can just try to list all tenants and find the matching ID.

    const { listActiveTenants } = await import('../server/services/tenant-provisioning.js');

    try {
        console.log(`🔍 Verifying tables for tenant ID: ${targetTenantId}`);
        const tenants = await listActiveTenants();
        const tenant = tenants.find(t => t.id === targetTenantId);

        if (!tenant) {
            console.error('❌ Tenant not found in active tenants list.');
            return;
        }

        console.log(`Found tenant: ${tenant.organizationName}`);

        const pool = new Pool({
            connectionString: tenant.connectionString,
            ssl: { rejectUnauthorized: false },
        });

        try {
            const res = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('daily_lub_assignings', 'daily_nozzle_assignings');
      `);

            console.log('Found tables:', res.rows.map(r => r.table_name));

            if (res.rows.length === 2) {
                console.log('✅ Both tables exist.');
            } else {
                console.log('❌ Missing tables.');
            }

        } catch (err) {
            console.error('❌ Error querying tenant DB:', err);
        } finally {
            await pool.end();
        }

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

verifyTenantTables();
